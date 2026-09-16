import { App } from 'aws-cdk-lib';
import { existsSync } from 'node:fs';
import { TutoringStack } from './stack.js';

if(existsSync('.env'))process.loadEnvFile('.env');
const app=new App();
new TutoringStack(app,'DataStructuresTutoring',{
  env:{account:process.env.CDK_DEFAULT_ACCOUNT,region:process.env.CDK_DEFAULT_REGION||'ap-northeast-2'}
});
