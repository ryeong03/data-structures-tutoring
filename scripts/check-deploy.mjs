import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

if (existsSync('.env')) process.loadEnvFile('.env');

const required = [
  'TUTOR_EMAIL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET_ARN',
  'ANTHROPIC_SECRET_ARN',
  'TELEGRAM_SECRET_ARN',
  'COGNITO_DOMAIN_PREFIX',
  'BUDGET_EMAIL',
  'MATERIALS_DIR',
];
const missing = required.filter(key => !process.env[key] || /example\.com|replace-me|ACCOUNT|XXXX/i.test(process.env[key]));
if (missing.length) {
  console.error(`배포 설정이 필요합니다: ${missing.join(', ')}. .env.example을 참고해 .env를 작성하세요.`);
  process.exit(1);
}

const email = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
if (!email.test(process.env.TUTOR_EMAIL) || !email.test(process.env.BUDGET_EMAIL)) {
  console.error('TUTOR_EMAIL과 BUDGET_EMAIL은 실제 이메일 주소여야 합니다.');
  process.exit(1);
}
if (!existsSync(process.env.MATERIALS_DIR)) {
  console.error('MATERIALS_DIR 경로에서 PDF 폴더를 찾지 못했습니다.');
  process.exit(1);
}
if (!/^[a-z0-9][a-z0-9-]{2,61}$/.test(process.env.COGNITO_DOMAIN_PREFIX)) {
  console.error('COGNITO_DOMAIN_PREFIX는 소문자, 숫자, 하이픈으로 된 3~62자여야 합니다.');
  process.exit(1);
}
if (process.env.APP_URL) {
  try {
    const url = new URL(process.env.APP_URL);
    if (url.protocol !== 'https:' || url.pathname !== '/' || url.search || url.hash) throw new Error();
  } catch {
    console.error('APP_URL은 https://도메인 형식이어야 합니다.');
    process.exit(1);
  }
}

const secrets = [
  ['GOOGLE_CLIENT_SECRET_ARN', 'Google OAuth 비밀'],
  ['ANTHROPIC_SECRET_ARN', 'Claude API 비밀'],
  ['TELEGRAM_SECRET_ARN', 'Telegram 봇 비밀'],
];
for (const [envKey, label] of secrets) {
  let value;
  try {
    value = execFileSync('aws', [
      'secretsmanager', 'get-secret-value', '--secret-id', process.env[envKey],
      '--region', 'ap-northeast-2', '--query', 'SecretString', '--output', 'text',
    ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch {
    console.error(`${label}을 읽을 수 없습니다. AWS 로그인과 Secrets Manager의 비밀값을 확인하세요.`);
    process.exit(1);
  }
  if (!value || value === 'None' || /^(pending|replace-me|example)$/i.test(value)) {
    console.error(`${label}에 실제 비밀값을 저장해야 합니다.`);
    process.exit(1);
  }
  if (envKey === 'TELEGRAM_SECRET_ARN') {
    try {
      const config = JSON.parse(value);
      if (!config.botToken || !config.chatId) throw new Error();
    } catch {
      console.error('Telegram 봇 비밀은 botToken과 chatId가 있는 JSON이어야 합니다.');
      process.exit(1);
    }
  }
}

console.log('배포 설정과 비밀값을 확인했습니다.');
