import type { PreSignUpTriggerEvent } from 'aws-lambda';

export async function handler(event:PreSignUpTriggerEvent):Promise<PreSignUpTriggerEvent>{
  if(event.triggerSource!=='PreSignUp_ExternalProvider') throw new Error('Google 로그인만 허용합니다.');
  const email=String(event.request.userAttributes.email||'').trim().toLowerCase();
  const verified=event.request.userAttributes.email_verified;
  if(!email || String(verified)!=='true') throw new Error('확인된 Google 이메일이 필요합니다.');
  return event;
}
