import React from 'react';
import { createRoot } from 'react-dom/client';
import { Amplify } from 'aws-amplify';
import App from './App';
import './style.css';

type Config={region:string;userPoolId:string;clientId:string;cognitoDomain:string};
async function start(){
  const root=createRoot(document.getElementById('root')!);
  if(import.meta.env.DEV&&import.meta.env.VITE_DEMO==='1'){
    try {
      const response=await fetch('/local-preview/names',{cache:'no-store'});
      if(response.ok){const {setDemoNames}=await import('./demo');setDemoNames(await response.json());}
    } catch { /* Keep anonymous fallback names if the local preview file is unavailable. */ }
    root.render(<React.StrictMode><App demo/></React.StrictMode>);return;
  }
  try{
    const response=await fetch('/api/config',{cache:'no-store'});
    if(!response.ok)throw new Error('설정 API에 연결할 수 없습니다.');
    const config=await response.json() as Config;
    Amplify.configure({Auth:{Cognito:{userPoolId:config.userPoolId,userPoolClientId:config.clientId,loginWith:{oauth:{domain:config.cognitoDomain,scopes:['openid','email','profile'],redirectSignIn:[window.location.origin+'/'],redirectSignOut:[window.location.origin+'/'],responseType:'code'}}}}});
    root.render(<React.StrictMode><App/></React.StrictMode>);
  }catch(error){root.render(<div className="setup"><div className="setup-card"><div className="brand-mark">자료구조 튜터링</div><h1>배포 설정이 필요해요</h1><p>AWS API가 연결되면 로그인과 튜터링 공간이 열립니다.</p><pre>{String(error)}</pre></div></div>);}
}
start();
