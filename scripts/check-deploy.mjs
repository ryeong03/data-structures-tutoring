import { existsSync } from 'node:fs';

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

console.log('배포 설정 형식을 확인했습니다.');
