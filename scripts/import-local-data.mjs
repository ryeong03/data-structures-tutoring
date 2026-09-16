import { readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { createHash } from 'node:crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

if (process.env.NODE_ENV !== 'test') {
  try { process.loadEnvFile('.env'); } catch { /* AWS variables may come from the shell. */ }
}

const outputs = JSON.parse(await readFile('cdk-outputs.json', 'utf8')).DataStructuresTutoring;
const table = outputs?.RecordsTableName;
const bucket = outputs?.FilesBucketName;
if (!table || !bucket) throw new Error('CDK 출력에서 자료 저장소를 찾지 못했습니다.');

const manifest = JSON.parse(await readFile('.local/materials.json', 'utf8'));
if (!Array.isArray(manifest)) throw new Error('PDF 목록을 확인해 주세요.');
const files = [];
for (const entry of manifest) {
  if (!Number.isInteger(entry.weekId) || entry.weekId < 1 || entry.weekId > 10 || typeof entry.name !== 'string' || basename(entry.name) !== entry.name || !entry.name.toLowerCase().endsWith('.pdf')) throw new Error('PDF 목록을 확인해 주세요.');
  const bytes = await readFile(join(process.env.MATERIALS_DIR || '', entry.name));
  if (bytes.length > 10_000_000 || bytes.subarray(0, 5).toString('ascii') !== '%PDF-') throw new Error(`PDF 파일을 확인해 주세요: ${entry.name}`);
  const id = createHash('sha256').update(`${entry.weekId}/${entry.name}`).digest('hex').slice(0, 24);
  files.push({ ...entry, bytes, id, key: `materials/${id}.pdf` });
}

const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'ap-northeast-2';
const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));
const s3 = new S3Client({ region });
const putOnce = async Item => {
  try { await db.send(new PutCommand({ TableName: table, Item, ConditionExpression: 'attribute_not_exists(pk)' })); }
  catch (error) { if (error?.name !== 'ConditionalCheckFailedException') throw error; }
};

for (const file of files) {
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: file.key, Body: file.bytes, ContentType: 'application/pdf' }));
  await putOnce({ pk: `MATERIAL#${file.id}`, sk: 'META', data: { id: file.id, weekId: file.weekId, name: file.name, key: file.key, size: file.bytes.length, createdAt: new Date().toISOString() } });
}
console.log(`비공개 PDF ${files.length}개를 가져왔습니다.`);
