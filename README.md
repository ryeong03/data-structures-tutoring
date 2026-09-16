# 자료구조 튜터링

**Data Structures Peer Tutoring** is a private learning hub for a planned 10-session, 50-minute peer tutoring program. Students explain assigned topics, the tutor clarifies key concepts, and each meeting ends with questions. The site includes a week-by-week map, notices, private materials, attendance, reports, Q&A, and concept quizzes. Built with React, TypeScript, and AWS CDK.

Site: https://d1nhri0xudbp4k.cloudfront.net/

튜터 1명과 튜티 최대 5명이 쓰는 자료구조 튜터링 웹사이트입니다. React·TypeScript 화면, Cognito Google 로그인, API Gateway·Lambda, DynamoDB, 비공개 S3 자료 저장소, CloudFront를 AWS CDK로 배포합니다.

## 현재 잠정 일정

첫 미팅은 **2026년 9월 17일(목) 18:30, Zoom**입니다. 소개와 운영 안내를 위한 모임이며, 링크는 튜터가 받는 대로 **Zoom 모임** 탭에 등록합니다. 이 안내는 탐험 지도 게시판의 첫 공지에도 준비했습니다.

정규 튜터링은 **화요일 11:00~11:50**입니다. 장소는 공간 대여 현황에 따라 정하고 **모임 전날 웹사이트에 공지**합니다. 일부 모임은 비대면으로 진행할 수 있습니다. 최초 10회는 9/22, 9/29, 10/6, 10/13, 10/27, 11/3, 11/10, 11/17, 11/24, 12/1로 입력되며, **10/20은 시험기간 휴강**입니다. 주제와 장소는 튜터가 확인하기 전까지 비공개이며 사이트에서 수정할 수 있습니다. 2학기 수업계획서와 현재 받은 PDF를 참고해 주제 초안을 입력했습니다.

매주 튜티 4~5명이 그 주에 배운 내용을 파트별로 5~10분씩 설명합니다. 각 설명 뒤 튜터가 핵심을 정리하고 마지막 약 10분은 질문에 답합니다. 이 흐름은 운영계획에서 확인할 수 있습니다.

홈은 10개 돌로 구성된 탐험 지도입니다. 돌을 누르면 해당 주차의 일정과 자료를 확인할 수 있고, 지도 안의 나무 게시판을 누르면 공지사항이 팝업으로 열립니다. [이화사이버캠퍼스](https://cyber.ewha.ac.kr/) 바로가기도 지도 위에 있습니다. 지도 배경은 [Kitbitz Nature Kit](https://kitbitz.art/kits/nature-kit)의 [공식 월드 이미지](https://kitbitz.art/world-previews/nature.webp), 돌은 [Kitbitz의 CC0 에셋](https://github.com/CaptExcellent/kits-library-assets)을 사용합니다.

제목에는 배달의민족 **주아체**, 본문에는 **한나체 Air**를 적용했습니다. 두 글꼴의 저작권과 사용 조건은 [우아한형제들 글꼴 안내](https://www.woowahan.com/fonts)와 [라이선스](https://www.woowahan.com/fonts/license)에 따릅니다. 함께 배포하는 라이선스 사본은 [LICENSE.txt](web/public/fonts/LICENSE.txt)에 있습니다.

## 로컬 확인

Node.js 22 이상이 필요합니다.

```bash
npm install
npm run dev:demo
```

로컬 미리보기는 `http://127.0.0.1:5173/`에서 열립니다. 예시 데이터로 화면을 확인할 수 있으며 실제 Google 로그인, 파일 저장, Claude API 호출은 하지 않습니다. 이 컴퓨터의 `.local/preview-names.json`에 적은 이름 5개는 **로컬 미리보기에서만** 읽습니다. 이 파일은 Git에서 제외되고 배포 파일에 포함되지 않습니다. 학번과 전화번호는 입력하지 않습니다.

```bash
npm run typecheck
npm test
npm run build
npm run synth
```

## AWS 배포 준비

1. `ap-northeast-2` 리전의 AWS 계정을 준비하고 로컬에 AWS CLI 인증을 설정합니다. CDK가 사용할 권한에는 CloudFormation, IAM, S3, CloudFront, Lambda, API Gateway, Cognito, DynamoDB, Secrets Manager, Budgets, Bedrock이 포함되어야 합니다.
2. Google Cloud Console에서 OAuth 동의 화면을 **External**로 설정하고 **웹 애플리케이션** OAuth 클라이언트를 만듭니다. 학교와 개인 계정이 섞여 있으므로 Internal로 설정하면 외부 계정이 막힐 수 있습니다. 승인된 리디렉션 URI로 `https://ryeong-ds-tutoring-2026.auth.ap-northeast-2.amazoncognito.com/oauth2/idpresponse`를 등록합니다. Google Client ID와 Client Secret을 받습니다. 이 앱은 기본 로그인 범위(`openid`, `email`, `profile`)만 사용하며, [Google 정책상 이 범위만 쓰는 앱은 Testing 모드의 테스트 사용자 제한에서 제외될 수 있습니다](https://developers.google.com/identity/protocols/oauth2/production-readiness/overview).
3. AWS Secrets Manager에 Google Client Secret과 Telegram 봇 설정을 각각 비밀로 저장합니다. Telegram 비밀은 `{"botToken":"봇 토큰","chatId":"개인 채팅 ID"}` 형식입니다. 비밀은 코드나 `.env`에 넣지 말고 각 비밀의 **전체 ARN**만 사용합니다. 퀴즈 생성은 AWS Bedrock의 Claude를 사용하므로 별도 Claude API 키는 필요하지 않습니다. Bedrock에서 Anthropic 모델 첫 사용 양식을 제출해야 합니다.
4. 이미 준비한 `.env`에 Google Client ID와 두 비밀 ARN을 입력합니다. 튜터 이메일, 튜터명, 도메인 접두사, PDF 폴더 경로, 비용 알림 이메일은 로컬 설정에 반영합니다. `.env`, `.local/`, `cdk-outputs.json`은 Git에서 제외됩니다.

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

## 처음 접속한 뒤

1. `TUTOR_EMAIL`과 일치하는 Google 계정으로 로그인합니다. 이 계정이 유일한 튜터입니다.
2. **튜터 전용**에서 가입코드를 발급해 참가자에게 전달합니다. 참가자는 각자 Google 계정으로 로그인한 뒤 코드를 한 번 입력합니다. 최대 다섯 명까지 가입할 수 있습니다.
3. 튜터 전용 명단에서 가입한 튜티의 표시 이름과 권한을 고칠 수 있습니다. 참여하지 않는 튜티는 명단에서 제외해 새 참가자 자리를 만들 수 있습니다. 대표튜티 한 명을 지정합니다. 대표튜티는 공개된 주차의 자료와 도달 페이지를 기록합니다.
4. 다섯 번째 튜티가 가입하면 10회 보고서 담당자가 각 2회씩 자동 배정됩니다. 다섯 명이 확정되지 않아도 튜터가 주차별 담당자를 직접 지정할 수 있습니다.
5. **일정·자료**에서 잠정 날짜와 주제, 장소, 보고서 담당자를 검토한 뒤 각 주차를 공개합니다. PDF는 10MB 이하로 올립니다. **Zoom 모임**에서 링크를, **홈**의 게시판에서 공지를 등록합니다.
6. **개념 퀴즈**에서 핵심 개념과 PDF를 골라 Claude 초안을 만들거나 [HTML 공통 템플릿](web/public/quiz-template.html)을 업로드합니다. 문항·정답·해설을 검토한 뒤 공개합니다. 튜티 답안은 서버에서 채점합니다.

출석, 세션 메모, 제출 현황, AI 사용 기록, 활동 로그, 전체 기록 ZIP 다운로드는 튜터에게만 제공됩니다. 튜터는 튜티 화면 미리보기를 사용할 수 있습니다. 사용 중인 계정이 비활성화되면 서버가 매 요청마다 접근을 차단합니다.

## 비용과 비밀

월 AWS 비용 예산은 50 USD이며 실제 지출 10 USD와 50 USD에 이메일 알림을 보냅니다. 예산은 사용을 자동 중지하지 않습니다. Claude 퀴즈 생성은 Bedrock 사용량으로 과금되며, 성공적으로 생성한 초안의 토큰 사용량은 튜터 화면에 기록됩니다.

자료 버킷은 공개 접근을 차단합니다. PDF는 로그인·권한 확인 뒤 60초 유효한 링크로 받습니다. DynamoDB의 시점 복구가 켜져 있습니다. 사이트와 자료 버킷, 데이터베이스는 스택 삭제 시 보존하도록 설정했습니다.
