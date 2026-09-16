import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Stack, Duration, RemovalPolicy, CfnOutput, SecretValue, type StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodeLambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as authorizers from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import * as secrets from 'aws-cdk-lib/aws-secretsmanager';
import * as budgets from 'aws-cdk-lib/aws-budgets';

const projectDir=path.dirname(path.dirname(fileURLToPath(import.meta.url)));

export class TutoringStack extends Stack {
  constructor(scope:Construct,id:string,props?:StackProps){
    super(scope,id,props);
    const tutorEmail=(process.env.TUTOR_EMAIL||'tutor@example.com').trim().toLowerCase();
    const appUrl=process.env.APP_URL||'http://localhost:5173';
    const callback=appUrl.endsWith('/')?appUrl:`${appUrl}/`;
    const domainPrefix=process.env.COGNITO_DOMAIN_PREFIX||`tutoring-${this.account}`;
    const googleClientId=process.env.GOOGLE_CLIENT_ID||'replace-me.apps.googleusercontent.com';
    const googleSecretArn=process.env.GOOGLE_CLIENT_SECRET_ARN;
    const anthSecretArn=process.env.ANTHROPIC_SECRET_ARN;
    const telegramSecretArn=process.env.TELEGRAM_SECRET_ARN;

    const table=new dynamodb.Table(this,'Records',{
      partitionKey:{name:'pk',type:dynamodb.AttributeType.STRING},sortKey:{name:'sk',type:dynamodb.AttributeType.STRING},
      billingMode:dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification:{pointInTimeRecoveryEnabled:true},removalPolicy:RemovalPolicy.RETAIN
    });
    const fileBucket=new s3.Bucket(this,'Files',{
      blockPublicAccess:s3.BlockPublicAccess.BLOCK_ALL,enforceSSL:true,
      encryption:s3.BucketEncryption.S3_MANAGED,removalPolicy:RemovalPolicy.RETAIN,
      cors:[{allowedMethods:[s3.HttpMethods.PUT],allowedOrigins:[appUrl],allowedHeaders:['*'],maxAge:300}],
      lifecycleRules:[{prefix:'exports/',expiration:Duration.days(1)}]
    });
    const siteBucket=new s3.Bucket(this,'Site',{
      blockPublicAccess:s3.BlockPublicAccess.BLOCK_ALL,enforceSSL:true,
      encryption:s3.BucketEncryption.S3_MANAGED,removalPolicy:RemovalPolicy.RETAIN
    });

    const signupFn=new nodeLambda.NodejsFunction(this,'PreSignup',{
      entry:path.join(projectDir,'api/signup.ts'),handler:'handler',runtime:lambda.Runtime.NODEJS_22_X,
      timeout:Duration.seconds(10),
      bundling:{minify:true,sourceMap:true}
    });
    const pool=new cognito.UserPool(this,'Users',{
      selfSignUpEnabled:false,signInAliases:{email:true},
      standardAttributes:{email:{required:true,mutable:true}},
      lambdaTriggers:{preSignUp:signupFn},removalPolicy:RemovalPolicy.RETAIN
    });
    const googleSecret=googleSecretArn?secrets.Secret.fromSecretCompleteArn(this,'GoogleSecret',googleSecretArn):undefined;
    const googleProvider=new cognito.UserPoolIdentityProviderGoogle(this,'Google',{
      userPool:pool,clientId:googleClientId,
      clientSecretValue:googleSecret?.secretValue||SecretValue.unsafePlainText('SET_GOOGLE_CLIENT_SECRET_ARN'),
      scopes:['openid','email','profile'],
      attributeMapping:{email:cognito.ProviderAttribute.GOOGLE_EMAIL,emailVerified:cognito.ProviderAttribute.GOOGLE_EMAIL_VERIFIED,fullname:cognito.ProviderAttribute.GOOGLE_NAME}
    });
    const domain=pool.addDomain('Domain',{cognitoDomain:{domainPrefix}});
    const client=pool.addClient('WebClient',{
      generateSecret:false,preventUserExistenceErrors:true,
      supportedIdentityProviders:[cognito.UserPoolClientIdentityProvider.GOOGLE],
      oAuth:{flows:{authorizationCodeGrant:true},scopes:[cognito.OAuthScope.OPENID,cognito.OAuthScope.EMAIL,cognito.OAuthScope.PROFILE],callbackUrls:[callback],logoutUrls:[callback]}
    });
    client.node.addDependency(googleProvider);

    const apiFn=new nodeLambda.NodejsFunction(this,'ApiFunction',{
      entry:path.join(projectDir,'api/handler.ts'),handler:'handler',runtime:lambda.Runtime.NODEJS_22_X,
      memorySize:1024,timeout:Duration.minutes(2),bundling:{minify:true,sourceMap:true},
      environment:{TABLE_NAME:table.tableName,FILE_BUCKET:fileBucket.bucketName,TUTOR_EMAIL:tutorEmail,TUTOR_DISPLAY_NAME:process.env.TUTOR_DISPLAY_NAME||'튜터',
        USER_POOL_ID:pool.userPoolId,USER_POOL_CLIENT_ID:client.userPoolClientId,
        COGNITO_DOMAIN:`${domainPrefix}.auth.${this.region}.amazoncognito.com`,
        ANTHROPIC_SECRET_ARN:anthSecretArn||'unset',TELEGRAM_SECRET_ARN:telegramSecretArn||'',SITE_URL:appUrl}
    });
    table.grantReadWriteData(apiFn);fileBucket.grantReadWrite(apiFn);
    if(anthSecretArn)secrets.Secret.fromSecretCompleteArn(this,'AnthropicSecret',anthSecretArn).grantRead(apiFn);
    if(telegramSecretArn)secrets.Secret.fromSecretCompleteArn(this,'TelegramSecret',telegramSecretArn).grantRead(apiFn);
    const httpApi=new apigwv2.HttpApi(this,'HttpApi',{createDefaultStage:true});
    const integration=new integrations.HttpLambdaIntegration('ApiIntegration',apiFn);
    const jwt=new authorizers.HttpJwtAuthorizer('Jwt',`https://cognito-idp.${this.region}.amazonaws.com/${pool.userPoolId}`,{jwtAudience:[client.userPoolClientId]});
    httpApi.addRoutes({path:'/api/config',methods:[apigwv2.HttpMethod.GET],integration});
    httpApi.addRoutes({path:'/api/{proxy+}',methods:[apigwv2.HttpMethod.ANY],integration,authorizer:jwt});

    const distribution=new cloudfront.Distribution(this,'Web',{
      defaultRootObject:'index.html',
      defaultBehavior:{origin:origins.S3BucketOrigin.withOriginAccessControl(siteBucket),viewerProtocolPolicy:cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS},
      additionalBehaviors:{'api/*':{origin:new origins.HttpOrigin(`${httpApi.apiId}.execute-api.${this.region}.${this.urlSuffix}`),
        allowedMethods:cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy:cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy:cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        viewerProtocolPolicy:cloudfront.ViewerProtocolPolicy.HTTPS_ONLY}}
    });
    new s3deploy.BucketDeployment(this,'DeployWeb',{
      sources:[s3deploy.Source.asset(path.join(projectDir,'dist'))],destinationBucket:siteBucket,
      distribution,distributionPaths:['/*']
    });
    if(process.env.BUDGET_EMAIL){
      new budgets.CfnBudget(this,'CostBudget',{
        budget:{budgetName:'data-structures-tutoring',budgetType:'COST',timeUnit:'MONTHLY',budgetLimit:{amount:50,unit:'USD'}},
        notificationsWithSubscribers:[10,50].map(amount=>({notification:{notificationType:'ACTUAL',comparisonOperator:'GREATER_THAN',threshold:amount*2,thresholdType:'PERCENTAGE'},subscribers:[{subscriptionType:'EMAIL',address:process.env.BUDGET_EMAIL!}]}))
      });
    }
    new CfnOutput(this,'SiteUrl',{value:`https://${distribution.distributionDomainName}`});
    new CfnOutput(this,'RecordsTableName',{value:table.tableName});
    new CfnOutput(this,'FilesBucketName',{value:fileBucket.bucketName});
    new CfnOutput(this,'GoogleRedirectUrl',{value:`https://${domainPrefix}.auth.${this.region}.amazoncognito.com/oauth2/idpresponse`});
    new CfnOutput(this,'RequiredAppUrlForSecondDeploy',{value:`https://${distribution.distributionDomainName}`});
  }
}
