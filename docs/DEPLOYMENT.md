# AWS 배포와 비용 관리

## 배포 준비

1. `ap-northeast-2` 리전의 AWS 계정을 준비하고 로컬에 AWS CLI 인증을 설정합니다. CDK가 사용할 권한에는 CloudFormation, IAM, S3, CloudFront, Lambda, API Gateway, Cognito, DynamoDB, Secrets Manager, Budgets가 포함되어야 합니다.
2. Google Cloud Console에서 OAuth 동의 화면을 **External**로 설정하고 **웹 애플리케이션** OAuth 클라이언트를 만듭니다. 학교와 개인 계정이 섞여 있으므로 Internal로 설정하면 외부 계정이 막힐 수 있습니다. 승인된 리디렉션 URI로 `https://ryeong-ds-tutoring-2026.auth.ap-northeast-2.amazoncognito.com/oauth2/idpresponse`를 등록합니다. Google Client ID와 Client Secret을 받습니다. 이 앱은 기본 로그인 범위(`openid`, `email`, `profile`)만 사용하며, [Google 정책상 이 범위만 쓰는 앱은 Testing 모드의 테스트 사용자 제한에서 제외될 수 있습니다](https://developers.google.com/identity/protocols/oauth2/production-readiness/overview).
3. AWS Secrets Manager에 Google Client Secret과 Telegram 봇 설정을 각각 비밀로 저장합니다. Telegram 비밀은 `{"botToken":"봇 토큰","chatId":"개인 채팅 ID"}` 형식입니다. 비밀은 코드나 `.env`에 넣지 말고 각 비밀의 **전체 ARN**만 사용합니다.
4. 이미 준비한 `.env`에 Google Client ID와 두 비밀 ARN을 입력합니다. 튜터 이메일, 튜터명, 도메인 접두사, PDF 폴더 경로, 비용 알림 이메일은 로컬 설정에 반영합니다. `.env`, `.local/`, `cdk-outputs.json`은 Git에서 제외됩니다.

현재 Telegram 알림은 기존 수업의 튜터에게만 보냅니다. 다른 튜터 수업의 학생 활동을 기존 봇으로 전달하지 않아 공간 간 정보가 섞이지 않습니다. 새 튜터별 Telegram 알림은 별도 봇 설정 후 연결해야 합니다.

Telegram 채팅 ID는 새 토큰으로 봇에게 `/start`를 보낸 후 이 프로젝트에서 `npm run telegram:chat-id`로 확인할 수 있습니다. 터미널에서 토큰을 숨겨 입력하며, 화면에는 채팅 ID만 출력합니다. 채팅 ID와 토큰을 Secrets Manager에 등록한 뒤에는 사이트가 튜티의 가입, 참석 응답, 질문·답글, 보고서 제출, 진도 기록, 퀴즈 제출을 튜터에게 알립니다. 알림 본문에는 보고서·질문 내용과 퀴즈 답안을 넣지 않습니다.

```bash
npx cdk bootstrap aws://<AWS_ACCOUNT_ID>/ap-northeast-2
npm run deploy
```

첫 배포 후 CDK 출력의 `SiteUrl`을 `.env`의 `APP_URL`로 입력하고 다시 배포합니다. CDK가 Cognito 앱 클라이언트의 콜백·로그아웃 URL과 PDF 업로드 허용 출처를 CloudFront 주소로 바꿉니다. Google Cloud Console의 승인된 리디렉션 URI는 위의 Cognito `/oauth2/idpresponse` 주소를 그대로 사용합니다.

```bash
# .env에 APP_URL=https://<CloudFront 도메인> 입력
npm run deploy
```

첫 배포의 콜백은 로컬 주소이고, 두 번째 배포 후 CloudFront 주소에서 Google 로그인을 사용할 수 있습니다. CDK 출력과 CloudFront 배포 완료를 확인한 뒤 사이트에 접속하세요.

배포 명령은 로컬 자료구조 PDF를 비공개 S3 버킷으로 가져옵니다. 튜티 이름·학번·전화번호 명단은 배포 파일에 넣거나 일괄 업로드하지 않습니다. 참가자는 직접 Google 계정과 가입코드로 가입하며, 사이트에는 가입에 필요한 계정 이메일과 표시 이름만 보관합니다. 나중에 자료를 다시 가져오려면 `npm run import:local`을 실행합니다.

### CI/CD

`.github/workflows/deploy.yml`은 Pull Request에서 타입 검사·테스트·웹 빌드를 실행합니다. `main`에 푸시하면 같은 검사를 통과한 뒤 AWS CDK로 사이트를 자동 배포합니다. GitHub Actions는 이 저장소의 `main` 브랜치에만 허용된 AWS OIDC 역할을 사용하며, AWS 장기 액세스 키나 Google·Telegram 비밀값은 GitHub에 저장하지 않습니다. 배포에 필요한 공개 설정과 Secrets Manager ARN은 GitHub Actions 저장소 변수에 있습니다. 교수님 PDF는 GitHub Actions에서 다루지 않고 비공개 S3에 보관하며, 자료를 바꿀 때만 이 컴퓨터에서 `npm run import:local`을 실행합니다.

## 운영 비용과 자료 접근

AWS 계정 전체의 비용을 살피기 위해 월 50 USD를 **임시 경고선**으로 설정했습니다. 실제 지출이 예산의 20%(10 USD)와 100%(50 USD)를 넘으면 이메일 알림을 보냅니다. 이 금액은 서비스 사용량으로 산출한 예상 비용이 아니며, 예산은 사용을 자동 중지하지 않습니다. 현재 사이트는 AI를 직접 호출하지 않으며, 이전 생성 기록의 토큰 사용량은 튜터 화면에 남아 있습니다.

자료 버킷은 공개 접근을 차단합니다. 주차 자료 PDF는 로그인·권한 확인 뒤 60초 유효한 링크로, 공지 PDF는 권한 확인 뒤 5분 유효한 뷰어 링크로 제공합니다. DynamoDB의 시점 복구가 켜져 있습니다. 사이트와 자료 버킷, 데이터베이스는 스택 삭제 시 보존하도록 설정했습니다.
