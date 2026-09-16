import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

const secrets=new SecretsManagerClient({});
let credentials:{botToken:string;chatId:string}|undefined;

export async function sendTutorTelegram(message:string):Promise<'sent'|'failed'|'unconfigured'>{
  const secretArn=process.env.TELEGRAM_SECRET_ARN;
  if(!secretArn)return 'unconfigured';
  try{
    if(!credentials){
      const secret=await secrets.send(new GetSecretValueCommand({SecretId:secretArn}));
      const parsed=JSON.parse(secret.SecretString||'{}');
      if(typeof parsed.botToken!=='string'||typeof parsed.chatId!=='string'||!parsed.botToken||!parsed.chatId)throw new Error('Telegram secret format');
      credentials={botToken:parsed.botToken,chatId:parsed.chatId};
    }
    const response=await fetch(`https://api.telegram.org/bot${credentials.botToken}/sendMessage`,{
      method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({chat_id:credentials.chatId,text:message}),
      signal:AbortSignal.timeout(5000)
    });
    const result=await response.json().catch(()=>({}));
    return response.ok&&result.ok===true?'sent':'failed';
  }catch{
    return 'failed';
  }
}
