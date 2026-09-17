import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { randomUUID, randomBytes, createHash } from 'node:crypto';
import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { zipSync, strToU8 } from 'fflate';
import { all, allGlobal, get, getGlobal, put, putGlobal, remove, queryGlobal, withWorkspace, workspaceId, DEFAULT_WORKSPACE, joinWithCode, redeemTutorInvite, removeJoinedMember, type Item } from './store.js';
import { sendTutorTelegram } from './telegram.js';
import { seedWeeks, kickoffNotice, validateSessionParts, validateQuizItems, parseQuizHtml, gradeQuiz, type Member, type Week, type Quiz, type Report, type Question, type Material, type Notice, type Rsvp } from '../shared/domain.js';
import { isPdfHeader, noticePdfKey, validPdfUpload } from './notice-attachment.js';
import { canViewWeek, canEditProgress, canWriteReport, canResolveQuestion, canRsvp } from '../shared/access.js';
import { normalizeInviteCode, isTutorInviteCode, formatTutorInviteCode } from '../shared/invites.js';

const s3=new S3Client({});
const bucket=process.env.FILE_BUCKET||'';
const ownerEmail=String(process.env.TUTOR_EMAIL||'').trim().toLowerCase();
type Workspace={id:string;name:string;tutorEmail:string;tutorName:string;createdAt:string;active:boolean};
const defaultWorkspace=():Workspace=>({id:DEFAULT_WORKSPACE,name:'자료구조 튜터링',tutorEmail:ownerEmail,tutorName:String(process.env.TUTOR_DISPLAY_NAME||'튜터'),createdAt:'2026-09-17T00:00:00.000Z',active:true});
async function workspaceList():Promise<Workspace[]>{return [defaultWorkspace(),...(await allGlobal()).filter(row=>row.pk.startsWith('WORKSPACE#')).map(row=>row.data as Workspace).filter(w=>w.id!==DEFAULT_WORKSPACE)].filter(w=>w.active);}
async function workspaceFor(id:string):Promise<Workspace|undefined>{return id===DEFAULT_WORKSPACE?defaultWorkspace():((await getGlobal(`WORKSPACE#${id}`))?.data as Workspace|undefined);}
const publicWorkspace=(workspace:Workspace)=>({id:workspace.id,name:workspace.name,tutorName:workspace.tutorName,active:workspace.active});
async function accountWorkspaces(email:string):Promise<Workspace[]>{if(email===ownerEmail)return workspaceList();const ids=(await queryGlobal(`ACCOUNT#${email}`)).map(row=>row.sk.slice(3));if(await getGlobal(`MEMBER#${email}`))ids.unshift(DEFAULT_WORKSPACE);const unique=[...new Set(ids)];return (await Promise.all(unique.map(workspaceFor))).filter((w):w is Workspace=>!!w?.active);}
const now=()=>new Date().toISOString();
const bad=(message:string,status=400)=>Object.assign(new Error(message),{status});
const json=(statusCode:number,data:unknown):APIGatewayProxyStructuredResultV2=>({statusCode,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'},body:JSON.stringify(data)});
const bodyOf=(event:APIGatewayProxyEventV2):Record<string,any>=>{
  if(!event.body) return {};
  if(event.body.length>450000) throw bad('요청이 너무 큽니다.',413);
  try { const value=JSON.parse(event.isBase64Encoded?Buffer.from(event.body,'base64').toString('utf8'):event.body);if(!value||typeof value!=='object'||Array.isArray(value))throw 0;return value; }
  catch {throw bad('JSON 요청을 확인해 주세요.');}
};
const txt=(x:unknown,max=10000)=>{if(typeof x!=='string'||!x.trim()||x.length>max)throw bad('입력 내용을 확인해 주세요.');return x.trim();};
const validate=<T>(operation:()=>T):T=>{try{return operation();}catch(error){throw bad(error instanceof Error?error.message:'입력 내용을 확인해 주세요.');}};
const weekId=(s:string)=>{const n=Number(s);if(!Number.isInteger(n)||n<1||n>10)throw bad('주차가 잘못되었습니다.');return n;};
const must=(member:Member,roles:Member['role'][] )=>{if(!roles.includes(member.role))throw bad('권한이 없습니다.',403);};
const data=<T>(item:Item|undefined):T|undefined=>item?.data as T|undefined;
const item=(pk:string,value:unknown,sk='META'):Item=>({pk,sk,data:value});
const membersFrom=(rows:Item[]):Member[]=>rows.filter(x=>x.pk.startsWith('MEMBER#')&&x.data?.active).map(x=>x.data as Member);
const codeHash=(code:string)=>createHash('sha256').update(normalizeInviteCode(code)).digest('hex');
function googleIdentity(event:APIGatewayProxyEventV2){
  const claims=(event.requestContext as any).authorizer?.jwt?.claims||{};
  const email=String(claims.email||'').trim().toLowerCase();
  if(claims.token_use!=='id'||claims.email_verified!==true&&claims.email_verified!=='true'||!email)throw bad('Google 계정 정보를 확인해 주세요.',401);
  return {email};
}
async function seed(){
  for(const week of seedWeeks){try{await put(item(`WEEK#${week.id}`,week),true);}catch(e:any){if(e.name!=='ConditionalCheckFailedException')throw e;}}
  if(workspaceId()!==DEFAULT_WORKSPACE)return;
  if(!await get('SEED#kickoff-notice')){
    try{await put(item(`NOTICE#${kickoffNotice.id}`,kickoffNotice),true);}catch(e:any){if(e.name!=='ConditionalCheckFailedException')throw e;}
    await put(item('SEED#kickoff-notice',{createdAt:now()}));
  }
  const previous=data<{title:string;body:string}>(await get(`NOTICE#${kickoffNotice.id}`));
  if(previous?.title==='9월 17일 18:00 첫 미팅 안내'&&previous.body.startsWith('9월 17일(목) 18:00에 Zoom으로 첫 미팅을 진행합니다.')){
    await put(item(`NOTICE#${kickoffNotice.id}`,kickoffNotice));
  }
  if(previous?.title==='9월 17일 18:30 첫 미팅 안내'&&previous.body==='9월 17일(목) 18:30에 Zoom으로 첫 미팅을 진행합니다. 서로 소개하고 튜터링 방식과 일정을 안내할게요. Zoom 링크는 「Zoom 모임」 탭에서 확인해 주세요.\n\n정규 튜터링은 화요일 11:00에 학관 또는 포스코관에서 진행하고, 비대면도 섞을 예정입니다. 자세한 내용은 첫 미팅에서 설명하겠습니다.'){
    await put(item(`NOTICE#${kickoffNotice.id}`,kickoffNotice));
  }
}
async function assignReportsIfReady(){
  const rows=await all();const students=membersFrom(rows).filter(m=>m.role!=='tutor').sort((a,b)=>a.createdAt.localeCompare(b.createdAt)||a.email.localeCompare(b.email));
  if(students.length!==5)return;
  const counts=new Map(students.map(m=>[m.id,0]));
  const weeks=rows.filter(x=>x.pk.startsWith('WEEK#')).map(x=>x.data as Week).sort((a,b)=>a.id-b.id);
  for(const week of weeks)if(week.reportMemberId&&counts.has(week.reportMemberId))counts.set(week.reportMemberId,counts.get(week.reportMemberId)!+1);
  for(const week of weeks){
    if(week.reportMemberId&&counts.has(week.reportMemberId))continue;
    const next=students.reduce((best,student)=>counts.get(student.id)!<counts.get(best.id)!?student:best,students[0]);
    await put(item(`WEEK#${week.id}`,{...week,reportMemberId:next.id}));
    counts.set(next.id,counts.get(next.id)!+1);
  }
}
async function current(event:APIGatewayProxyEventV2):Promise<Member>{
  const {email}=googleIdentity(event);
  if(email===ownerEmail){
    if(workspaceId()!==DEFAULT_WORKSPACE)return {id:`admin-${workspaceId()}`,email,name:String(process.env.TUTOR_DISPLAY_NAME||'튜터'),role:'tutor',active:true,createdAt:now()};
    let member=data<Member>(await get(`MEMBER#${email}`));
    if(!member){member={id:'tutor',email,name:String(process.env.TUTOR_DISPLAY_NAME||'튜터'),role:'tutor',active:true,createdAt:now()};await put(item(`MEMBER#${email}`,member),true).catch((e:any)=>{if(e.name!=='ConditionalCheckFailedException')throw e;});}
    if(!member.active)throw bad('계정이 비활성화되었습니다.',403);
    return {...member,role:'tutor'};
  }
  const member=data<Member>(await get(`MEMBER#${email}`));
  if(!member)throw bad('가입코드를 입력해 주세요.',403);
  if(!member.active)throw bad('이 계정은 접근이 중지되었습니다.',403);
  return member;
}
const publicMember=(m:Member)=>({id:m.id,name:m.name,role:m.role});
async function state(me:Member){
  if(me.role==='tutor')await seed();
  const workspace=await workspaceFor(workspaceId());
  const workspaces=await accountWorkspaces(me.email);
  const rows=await all();const members=membersFrom(rows);const allMembers=rows.filter(x=>x.pk.startsWith('MEMBER#')).map(x=>x.data as Member);
  const weeks=rows.filter(x=>x.pk.startsWith('WEEK#')).map(x=>x.data as Week).filter(w=>canViewWeek(me,w)).sort((a,b)=>a.id-b.id);
  const notices=rows.filter(x=>x.pk.startsWith('NOTICE#')).map(x=>x.data).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  const materials=rows.filter(x=>x.pk.startsWith('MATERIAL#')).map(x=>x.data as Material).filter(m=>me.role==='tutor'||weeks.some(w=>w.id===m.weekId));
  const replies=rows.filter(x=>x.pk.startsWith('REPLY#')).map(x=>x.data);
  const questions=rows.filter(x=>x.pk.startsWith('QUESTION#')).map(x=>({...x.data,replies:replies.filter(r=>r.questionId===x.data.id)})).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  const reports=rows.filter(x=>x.pk.startsWith('REPORT#')).map(x=>x.data as Report).filter(r=>me.role==='tutor'||weeks.some(w=>w.id===r.weekId)&&(r.status==='submitted'||r.authorId===me.id));
  const attempts=rows.filter(x=>x.pk.startsWith('ATTEMPT#')).map(x=>x.data).filter(a=>me.role==='tutor'||a.memberId===me.id&&weeks.some(w=>w.id===a.weekId));
  const rsvps=rows.filter(x=>x.pk.startsWith('RSVP#')).map(x=>x.data as Rsvp).filter(r=>me.role==='tutor'||r.memberId===me.id&&weeks.some(w=>w.id===r.weekId));
  const quizzes=rows.filter(x=>x.pk.startsWith('QUIZ#')).map(x=>x.data as Quiz).filter(q=>me.role==='tutor'||q.status==='published'&&weeks.some(w=>w.id===q.weekId)).map(q=>me.role==='tutor'||attempts.some(a=>a.weekId===q.weekId&&a.memberId===me.id)?q:{...q,items:q.items.map(({id,question,choices})=>({id,question,choices}))});
  const config=data<{zoomUrl:string}>(rows.find(x=>x.pk==='CONFIG'))||{zoomUrl:''};
  const tutorWeeks=me.role==='tutor'?rows.filter(x=>x.pk.startsWith('TUTORWEEK#')).map(x=>x.data):undefined;
  const aiUsage=me.role==='tutor'?rows.filter(x=>x.pk.startsWith('AI#')).map(x=>x.data).sort((a,b)=>b.at.localeCompare(a.at)):undefined;
  const activityLog=me.role==='tutor'?rows.filter(x=>x.pk.startsWith('AUDIT#')).map(x=>x.data).sort((a,b)=>b.at.localeCompare(a.at)).slice(0,100):undefined;
  return {workspace:workspace&&publicWorkspace(workspace),workspaces:workspaces.map(publicWorkspace),isAdmin:me.email===ownerEmail,me:me.role==='tutor'?me:{...publicMember(me),email:me.email},members:me.role==='tutor'?allMembers:members.map(publicMember),weeks,notices,materials,questions,reports,quizzes,attempts,rsvps,config,tutorWeeks,aiUsage,activityLog,inviteActive:me.role==='tutor'?rows.some(x=>x.pk==='INVITE#CURRENT'):undefined};
}
async function materialUrl(id:string,me:Member){
  const material=data<Material>(await get(`MATERIAL#${id}`));if(!material)throw bad('자료를 찾지 못했습니다.',404);
  const week=data<Week>(await get(`WEEK#${material.weekId}`));if(!week||!canViewWeek(me,week))throw bad('자료를 찾지 못했습니다.',404);
  return {url:await getSignedUrl(s3,new GetObjectCommand({Bucket:bucket,Key:material.key,ResponseContentDisposition:`attachment; filename*=UTF-8''${encodeURIComponent(material.name)}`}),{expiresIn:60})};
}
async function noticeAttachmentUrl(id:string){
  const notice=data<Notice>(await get(`NOTICE#${id}`));
  if(!notice?.attachment)throw bad('공지 첨부파일을 찾지 못했습니다.',404);
  return {url:await getSignedUrl(s3,new GetObjectCommand({
    Bucket:bucket,Key:noticePdfKey(workspaceId(),notice.attachment.id),
    ResponseContentType:'application/pdf',ResponseContentDisposition:'inline'
  }),{expiresIn:300})};
}
async function processRequest(event:APIGatewayProxyEventV2):Promise<APIGatewayProxyStructuredResultV2>{
  try{
    const method=event.requestContext.http.method;const path=event.rawPath.replace(/^\/api/,'');
    if(method==='GET'&&path==='/config')return json(200,{region:process.env.AWS_REGION,userPoolId:process.env.USER_POOL_ID,clientId:process.env.USER_POOL_CLIENT_ID,cognitoDomain:process.env.COGNITO_DOMAIN});
    if(method==='POST'&&path==='/join'){
      const {email}=googleIdentity(event),b=bodyOf(event);
      if(email===ownerEmail)throw bad('튜터 계정은 가입코드가 필요하지 않습니다.');
      const code=normalizeInviteCode(txt(b.code,60));
      if(isTutorInviteCode(code)){
        const tutorName=txt(b.name,80),name=txt(b.classroomName,100),id=randomUUID(),at=now();
        const workspace:Workspace={id,name,tutorEmail:email,tutorName,createdAt:at,active:true};
        const tutor:Member={id:randomUUID(),email,name:tutorName,role:'tutor',active:true,createdAt:at};
        try{await redeemTutorInvite(codeHash(code),email,item(`WORKSPACE#${id}`,workspace),item(`MEMBER#${email}`,tutor),at);}
        catch{throw bad('튜터 초대코드가 유효하지 않거나 이미 사용되었습니다.',403);}
        return json(201,{ok:true,workspaceId:id});
      }
      const prior=data<Member>(await get(`MEMBER#${email}`));
      if(prior?.active)return json(200,{ok:true,workspaceId:workspaceId()});
      if(prior)throw bad('이 계정은 접근이 중지되었습니다.',403);
      if(!/^[A-F0-9]{24}$/.test(code))throw bad('가입코드를 확인해 주세요.',403);
      const member:Member={id:randomUUID(),email,name:txt(b.name,80),role:'student',active:true,createdAt:now()};
      try{await joinWithCode(item(`MEMBER#${email}`,member),codeHash(code));}catch{throw bad('가입코드가 다르거나 가입 가능한 인원이 모두 찼습니다.',403);}
      await assignReportsIfReady();
      return json(201,{ok:true,workspaceId:workspaceId()});
    }
    const me=await current(event);
    if(path==='/admin/workspaces'&&method==='GET'){
      if(me.email!==ownerEmail)throw bad('권한이 없습니다.',403);
      const registry=await workspaceList(),rows=await allGlobal();
      return json(200,registry.map(w=>{const prefix=w.id===DEFAULT_WORKSPACE?'':`WS#${w.id}#`;const scoped=rows.filter(row=>w.id===DEFAULT_WORKSPACE?!row.pk.startsWith('WS#')&&!row.pk.startsWith('ACCOUNT#')&&!row.pk.startsWith('WORKSPACE#'):row.pk.startsWith(prefix));return {...publicWorkspace(w),studentCount:scoped.filter(row=>row.pk.startsWith(prefix+'MEMBER#')&&row.data?.active&&row.data?.role!=='tutor').length,materialCount:scoped.filter(row=>row.pk.startsWith(prefix+'MATERIAL#')).length,publishedWeeks:scoped.filter(row=>row.pk.startsWith(prefix+'WEEK#')&&row.data?.published).length};}));
    }
    if(path==='/admin/tutor-invites'&&method==='POST'){
      if(me.email!==ownerEmail)throw bad('권한이 없습니다.',403);
      const code=formatTutorInviteCode(randomBytes(12).toString('hex').toUpperCase());
      const expiresAt=new Date(Date.now()+7*24*60*60*1000).toISOString();
      await putGlobal({...item(`TUTORINVITE#${codeHash(code)}`,{createdAt:now(),createdBy:me.email}),expiresAt},true);
      return json(201,{code,expiresAt});
    }
    if(method==='GET'&&path==='/state')return json(200,await state(me));
    if(method==='GET'&&path==='/export'){
      must(me,['tutor']);const rows=await all();const files:Record<string,Uint8Array>={'records.json':strToU8(JSON.stringify(rows.filter(x=>!x.pk.startsWith('EXPORT#')),null,2))};
      for(const m of rows.filter(x=>x.pk.startsWith('MATERIAL#'))){const material=m.data as Material;const result=await s3.send(new GetObjectCommand({Bucket:bucket,Key:material.key}));const bytes=await result.Body?.transformToByteArray();if(bytes)files[`materials/${material.id}-${material.name.replace(/[^\w.가-힣-]/g,'_')}`]=bytes;}
      for(const n of rows.filter(x=>x.pk.startsWith('NOTICE#'))){const notice=n.data as Notice;if(!notice.attachment)continue;const result=await s3.send(new GetObjectCommand({Bucket:bucket,Key:noticePdfKey(workspaceId(),notice.attachment.id)}));const bytes=await result.Body?.transformToByteArray();if(bytes)files[`notice-attachments/${notice.id}-${notice.attachment.name.replace(/[^\w.가-힣-]/g,'_')}`]=bytes;}
      const key=`exports/${randomUUID()}.zip`;await s3.send(new PutObjectCommand({Bucket:bucket,Key:key,Body:zipSync(files,{level:0}),ContentType:'application/zip'}));
      return json(200,{url:await getSignedUrl(s3,new GetObjectCommand({Bucket:bucket,Key:key}),{expiresIn:300})});
    }
    let match:RegExpMatchArray|null;const b=method==='GET'?{}:bodyOf(event);
    if(method==='POST'&&path==='/invite-code'){
      must(me,['tutor']);const raw=randomBytes(12).toString('hex').toUpperCase();
      await put({...item('INVITE#CURRENT',{createdAt:now()}),codeHash:codeHash(raw)});
      return json(201,{code:raw.match(/.{1,4}/g)!.join('-')});
    }
    if(method==='PUT'&&path==='/config'){
      must(me,['tutor']);const zoomUrl=b.zoomUrl?txt(b.zoomUrl,500):'';
      if(zoomUrl&&!/^https:\/\//i.test(zoomUrl))throw bad('Zoom 링크는 https 주소여야 합니다.');
      await put(item('CONFIG',{zoomUrl}));return json(200,{ok:true});
    }
    if((match=path.match(/^\/members\/([^/]+)$/))&&method==='PATCH'){
      must(me,['tutor']);const email=decodeURIComponent(match[1]).toLowerCase();const member=data<Member>(await get(`MEMBER#${email}`));if(!member||member.role==='tutor')throw bad('튜티를 찾지 못했습니다.',404);
      if(b.role==='rep'){const rows=await all();for(const other of membersFrom(rows).filter(x=>x.role==='rep'&&x.email!==email))await put(item(`MEMBER#${other.email}`,{...other,role:'student'}));}
      const updated={...member,...(typeof b.name==='string'?{name:txt(b.name,80)}:{}),...(typeof b.active==='boolean'?{active:b.active}:{}),...(b.role==='rep'||b.role==='student'?{role:b.role}:{})};
      await put(item(`MEMBER#${email}`,updated));if(b.active===true)await assignReportsIfReady();return json(200,updated);
    }
    if((match=path.match(/^\/members\/([^/]+)$/))&&method==='DELETE'){
      must(me,['tutor']);const email=decodeURIComponent(match[1]).toLowerCase();const member=data<Member>(await get(`MEMBER#${email}`));if(!member||member.role==='tutor')throw bad('튜티를 찾지 못했습니다.',404);
      const rows=await all();
      const affected=rows.filter(x=>x.pk.startsWith('WEEK#')&&(x.data as Week).reportMemberId===member.id).map(x=>({id:(x.data as Week).id,report:rows.find(r=>r.pk===`REPORT#${(x.data as Week).id}`)}));
      await removeJoinedMember(email,member.id,affected);
      return json(200,{removedId:member.id});
    }
    if((match=path.match(/^\/weeks\/(\d+)\/rsvp$/))&&method==='PUT'){
      const id=weekId(match[1]),week=data<Week>(await get(`WEEK#${id}`));
      if(!week||!canRsvp(me,week))throw bad('공개된 튜터링 주차에만 응답할 수 있습니다.',403);
      if(b.status!=='yes'&&b.status!=='no')throw bad('참석 가능 또는 참석 어려움을 선택해 주세요.');
      const reason=b.status==='no'?txt(b.reason,500):undefined;
      if(reason&&reason.length<3)throw bad('참석이 어려운 사유를 3글자 이상 적어 주세요.');
      const rsvp:Rsvp={weekId:id,memberId:me.id,status:b.status,...(reason?{reason}:{}),updatedAt:now()};
      await put(item(`RSVP#${id}#${me.id}`,rsvp));return json(200,rsvp);
    }
    if((match=path.match(/^\/weeks\/(\d+)$/))&&method==='PATCH'){
      const id=weekId(match[1]);const week=data<Week>(await get(`WEEK#${id}`));if(!week)throw bad('주차를 찾지 못했습니다.',404);
      if(me.role==='rep'){
        if(!canEditProgress(me,week))throw bad('공개되지 않은 주차입니다.',404);
        const materialId=b.progressMaterialId?txt(b.progressMaterialId,100):undefined;
        if(materialId){const material=data<Material>(await get(`MATERIAL#${materialId}`));if(!material||material.weekId!==id)throw bad('이 주차의 자료를 선택해 주세요.');}
        const page=Number(b.progressPage);if(!materialId||!Number.isInteger(page)||page<1)throw bad('자료와 페이지를 입력해 주세요.');
        await put(item(`WEEK#${id}`,{...week,progressMaterialId:materialId,progressPage:page}));return json(200,{ok:true});
      }
      must(me,['tutor']);const update:Week={...week};
      if(typeof b.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(b.date))update.date=b.date;
      if(typeof b.time==='string'&&/^\d{2}:\d{2}$/.test(b.time))update.time=b.time;
      if(Number.isInteger(b.duration)&&b.duration>=30&&b.duration<=240)update.duration=b.duration;
      if(typeof b.location==='string')update.location=txt(b.location,100);
      if(typeof b.topic==='string')update.topic=txt(b.topic,200);
      if(typeof b.concepts==='string')update.concepts=txt(b.concepts,1000);
      if(Object.hasOwn(b,'sessionParts')){const rows=await all();update.sessionParts=validate(()=>validateSessionParts(b.sessionParts,membersFrom(rows).filter(m=>m.role!=='tutor').map(m=>m.id)));}
      if(typeof b.published==='boolean')update.published=b.published;
      if(typeof b.cleared==='boolean')update.cleared=b.cleared;
      if(typeof b.actualDate==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(b.actualDate))update.actualDate=b.actualDate;
      if(typeof b.reportMemberId==='string'){const rows=await all();if(!membersFrom(rows).some(m=>m.id===b.reportMemberId&&m.role!=='tutor'))throw bad('담당 튜티를 선택해 주세요.');update.reportMemberId=b.reportMemberId;}
      if(typeof b.progressMaterialId==='string'){const material=data<Material>(await get(`MATERIAL#${b.progressMaterialId}`));if(!material||material.weekId!==id)throw bad('이 주차의 자료를 선택해 주세요.');update.progressMaterialId=b.progressMaterialId;}
      if(Number.isInteger(b.progressPage)&&b.progressPage>0)update.progressPage=b.progressPage;
      if(update.reportMemberId!==week.reportMemberId){const old=data<Report>(await get(`REPORT#${id}`));if(old){await put(item(`REPORTARCHIVE#${id}#${randomUUID()}`,old));await remove(`REPORT#${id}`);}}
      await put(item(`WEEK#${id}`,update));return json(200,{ok:true});
    }
    if(method==='POST'&&path==='/materials/upload-url'){
      must(me,['tutor']);const name=txt(b.name,180);const size=Number(b.size);const id=weekId(String(b.weekId));
      if(!name.toLowerCase().endsWith('.pdf')||!Number.isInteger(size)||size<1||size>10_000_000)throw bad('10MB 이하 PDF만 올릴 수 있습니다.');
      const materialId=randomUUID(),key=workspaceId()===DEFAULT_WORKSPACE?`materials/${materialId}.pdf`:`workspaces/${workspaceId()}/materials/${materialId}.pdf`;
      const url=await getSignedUrl(s3,new PutObjectCommand({Bucket:bucket,Key:key,ContentType:'application/pdf'}),{expiresIn:300});
      return json(200,{url,materialId,key});
    }
    if(method==='POST'&&path==='/materials'){
      must(me,['tutor']);const id=txt(b.materialId,100),week=weekId(String(b.weekId));const key=workspaceId()===DEFAULT_WORKSPACE?`materials/${id}.pdf`:`workspaces/${workspaceId()}/materials/${id}.pdf`;
      if(await get(`MATERIAL#${id}`))throw bad('이미 등록된 자료입니다.');
      const object=await s3.send(new HeadObjectCommand({Bucket:bucket,Key:key})).catch(()=>{throw bad('업로드된 PDF를 찾지 못했습니다.');});
      if(!object.ContentLength||object.ContentLength>10_000_000||object.ContentType!=='application/pdf')throw bad('PDF 파일을 확인해 주세요.');
      const signature=await s3.send(new GetObjectCommand({Bucket:bucket,Key:key,Range:'bytes=0-4'}));
      const header=await signature.Body?.transformToByteArray();
      if(!header||Buffer.from(header).toString('ascii')!=='%PDF-')throw bad('PDF 파일 형식을 확인해 주세요.');
      const material:Material={id,weekId:week,name:txt(b.name,180),key,size:object.ContentLength,createdAt:now()};
      await put(item(`MATERIAL#${id}`,material),true);return json(201,material);
    }
    if((match=path.match(/^\/materials\/([^/]+)\/url$/))&&method==='GET')return json(200,await materialUrl(match[1],me));
    if(method==='POST'&&path==='/notice-attachments/upload-url'){
      must(me,['tutor']);const name=txt(b.name,180),size=Number(b.size);
      if(!validPdfUpload(name,size))throw bad('10MB 이하 PDF만 올릴 수 있습니다.');
      const attachmentId=randomUUID(),key=noticePdfKey(workspaceId(),attachmentId);
      const url=await getSignedUrl(s3,new PutObjectCommand({Bucket:bucket,Key:key,ContentType:'application/pdf'}),{expiresIn:300});
      return json(200,{url,attachmentId});
    }
    if(method==='POST'&&path==='/notices'){
      must(me,['tutor']);
      let attachment:Notice['attachment'];
      if(b.attachmentId){
        const id=txt(b.attachmentId,100),name=txt(b.attachmentName,180),key=validate(()=>noticePdfKey(workspaceId(),id));
        const object=await s3.send(new HeadObjectCommand({Bucket:bucket,Key:key})).catch(()=>{throw bad('업로드된 PDF를 찾지 못했습니다.');});
        if(!object.ContentLength||!validPdfUpload(name,object.ContentLength)||object.ContentType!=='application/pdf')throw bad('PDF 파일을 확인해 주세요.');
        const signature=await s3.send(new GetObjectCommand({Bucket:bucket,Key:key,Range:'bytes=0-4'}));
        if(!isPdfHeader(await signature.Body?.transformToByteArray()))throw bad('PDF 파일 형식을 확인해 주세요.');
        attachment={id,name,size:object.ContentLength};
      }
      const notice:Notice={id:randomUUID(),title:txt(b.title,160),body:txt(b.body,5000),pinned:!!b.pinned,createdAt:now(),...(attachment?{attachment}:{})};
      await put(item(`NOTICE#${notice.id}`,notice));return json(201,notice);
    }
    if((match=path.match(/^\/notices\/([^/]+)\/attachment-url$/))&&method==='GET')return json(200,await noticeAttachmentUrl(match[1]));
    if((match=path.match(/^\/notices\/([^/]+)$/))&&method==='DELETE'){
      must(me,['tutor']);const notice=data<Notice>(await get(`NOTICE#${match[1]}`));
      await remove(`NOTICE#${match[1]}`);
      if(notice?.attachment)await s3.send(new DeleteObjectCommand({Bucket:bucket,Key:noticePdfKey(workspaceId(),notice.attachment.id)}));
      return json(200,{ok:true});
    }
    if(method==='POST'&&path==='/questions'){
      const question:Question={id:randomUUID(),title:txt(b.title,180),body:txt(b.body,5000),authorId:me.id,createdAt:now(),resolved:false,replies:[]};await put(item(`QUESTION#${question.id}`,question));return json(201,question);
    }
    if((match=path.match(/^\/questions\/([^/]+)\/replies$/))&&method==='POST'){
      const question=data<Question>(await get(`QUESTION#${match[1]}`));if(!question)throw bad('질문을 찾지 못했습니다.',404);
      const reply={id:randomUUID(),questionId:question.id,body:txt(b.body,5000),authorId:me.id,createdAt:now()};await put(item(`REPLY#${reply.id}`,reply));return json(201,reply);
    }
    if((match=path.match(/^\/questions\/([^/]+)$/))&&method==='PATCH'){
      const question=data<Question>(await get(`QUESTION#${match[1]}`));if(!question)throw bad('질문을 찾지 못했습니다.',404);
      if(!canResolveQuestion(me,question))throw bad('권한이 없습니다.',403);
      await put(item(`QUESTION#${question.id}`,{...question,resolved:!!b.resolved}));return json(200,{ok:true});
    }
    if((match=path.match(/^\/reports\/(\d+)$/))&&method==='PUT'){
      const id=weekId(match[1]),week=data<Week>(await get(`WEEK#${id}`));if(!week||!week.published||!week.reportMemberId)throw bad('보고서 주차가 공개되지 않았습니다.',404);
      if(!canWriteReport(me,week))throw bad('이번 주 보고서 담당자가 아닙니다.',403);
      const prior=data<Report>(await get(`REPORT#${id}`));const status=b.status==='submitted'?'submitted':'draft';
      const report:Report={weekId:id,authorId:me.id,content:txt(b.content,15000),status,updatedAt:now(),submittedAt:status==='submitted'?(prior?.submittedAt||now()):undefined};
      await put(item(`REPORT#${id}`,report));return json(200,report);
    }
    if((match=path.match(/^\/tutor-weeks\/(\d+)$/))&&method==='PUT'){
      must(me,['tutor']);const id=weekId(match[1]);const rows=await all(),memberIds=new Set(membersFrom(rows).filter(x=>x.role!=='tutor').map(x=>x.id));
      const attendance:Record<string,boolean>={};for(const [key,value] of Object.entries(b.attendance||{}))if(memberIds.has(key)&&typeof value==='boolean')attendance[key]=value;
      await put(item(`TUTORWEEK#${id}`,{weekId:id,attendance,notes:typeof b.notes==='string'?b.notes.slice(0,10000):''}));return json(200,{ok:true});
    }
    if((match=path.match(/^\/quizzes\/(\d+)\/html$/))&&method==='POST'){
      must(me,['tutor']);const id=weekId(match[1]),html=txt(b.html,200000);const items=validate(()=>parseQuizHtml(html));
      const week=data<Week>(await get(`WEEK#${id}`));if(!week)throw bad('주차를 찾지 못했습니다.',404);
      const quiz:Quiz={weekId:id,title:week.topic,concepts:week.concepts,status:'draft',items,source:'html',updatedAt:now()};await put(item(`QUIZ#${id}`,quiz));return json(200,quiz);
    }
    if((match=path.match(/^\/quizzes\/(\d+)\/json$/))&&method==='POST'){
      must(me,['tutor']);const id=weekId(match[1]);
      const week=data<Week>(await get(`WEEK#${id}`));if(!week)throw bad('주차를 찾지 못했습니다.',404);
      let parsed:unknown;
      try{parsed=JSON.parse(txt(b.json,50000));}catch{throw bad('JSON 형식을 확인해 주세요.');}
      const raw=Array.isArray(parsed)?parsed:parsed&&typeof parsed==='object'?'items' in parsed?(parsed as {items:unknown}).items:undefined:undefined;
      const items=validate(()=>validateQuizItems(raw));
      const quiz:Quiz={weekId:id,title:week.topic,concepts:week.concepts,status:'draft',items,source:'manual',updatedAt:now()};
      await put(item(`QUIZ#${id}`,quiz));return json(200,quiz);
    }
    if((match=path.match(/^\/quizzes\/(\d+)\/generate$/))&&method==='POST'){
      must(me,['tutor']);
      throw bad('AI 퀴즈 생성 연결을 준비 중입니다. HTML 퀴즈를 올려 주세요.',503);
    }
    if((match=path.match(/^\/quizzes\/(\d+)$/))&&method==='PUT'){
      must(me,['tutor']);const id=weekId(match[1]);const prior=data<Quiz>(await get(`QUIZ#${id}`));if(!prior)throw bad('먼저 퀴즈 초안을 만들어 주세요.',404);
      const updated:Quiz={...prior,items:validate(()=>validateQuizItems(b.items||prior.items)),status:b.status==='published'?'published':'draft',updatedAt:now()};await put(item(`QUIZ#${id}`,updated));return json(200,updated);
    }
    if((match=path.match(/^\/quizzes\/(\d+)\/attempts$/))&&method==='POST'){
      const id=weekId(match[1]),quiz=data<Quiz>(await get(`QUIZ#${id}`)),week=data<Week>(await get(`WEEK#${id}`));if(!quiz||quiz.status!=='published'||!week||!canViewWeek(me,week))throw bad('공개된 퀴즈가 없습니다.',404);
      const answers=b.answers as number[];const result=validate(()=>gradeQuiz(quiz.items,answers));
      const attempt={weekId:id,memberId:me.id,at:now(),answers,score:result.score};await put(item(`ATTEMPT#${id}#${randomUUID()}`,attempt));return json(200,{...attempt,details:result.details});
    }
    throw bad('요청 경로를 찾지 못했습니다.',404);
  }catch(error:any){if(!error.status)console.error(error);return json(error.status||500,{error:error.status?error.message:'요청을 처리하지 못했습니다.'});}
}

function auditAction(method:string,path:string){
  if(path==='/join')return 'join';
  if(path==='/invite-code')return 'invite-code';
  if(path==='/config')return 'zoom';
  if(path.startsWith('/members/'))return 'member';
  if(path.endsWith('/rsvp'))return 'rsvp';
  if(path.startsWith('/weeks/'))return 'week';
  if(path==='/materials')return 'material';
  if(path==='/notices'||path.startsWith('/notices/'))return method==='DELETE'?'notice-delete':'notice';
  if(path.startsWith('/questions/'))return path.endsWith('/replies')?'reply':'question-update';
  if(path==='/questions')return 'question';
  if(path==='/admin/tutor-invites')return 'tutor-invite';
  if(path.startsWith('/reports/'))return 'report';
  if(path.startsWith('/tutor-weeks/'))return 'tutor-note';
  if(path.includes('/attempts'))return 'quiz-attempt';
  if(path.includes('/generate'))return 'quiz-generate';
  if(path.includes('/html')||path.includes('/json'))return 'quiz-import';
  if(path.startsWith('/quizzes/'))return 'quiz-update';
  return '';
}
async function studentNotification(action:string,actor:Member,path:string,response:APIGatewayProxyStructuredResultV2){
  if(actor.role==='tutor'||workspaceId()!==DEFAULT_WORKSPACE)return 'none';
  const payload=JSON.parse(String(response.body||'{}'));
  const label:Record<string,string>={join:'팀에 가입했어요',rsvp:payload.status==='no'?'다음 튜터링에 참석하기 어렵다고 답했어요':'다음 튜터링에 참석 가능하다고 답했어요',week:'진도를 기록했어요',question:'질문을 올렸어요',reply:'답글을 올렸어요','quiz-attempt':'퀴즈 답안을 제출했어요'};
  if(action==='report'&&payload.status==='submitted')label.report='주별보고서를 제출했어요';
  if(!label[action])return 'none';
  const week=path.match(/\/(?:weeks|reports|quizzes)\/(\d+)/)?.[1];
  const site=process.env.SITE_URL?.startsWith('https://')?`\n${process.env.SITE_URL}`:'';
  return sendTutorTelegram(`📚 자료구조 튜터링\n${actor.name}님이 ${week?`${week}주차 `:''}${label[action]}${site}`);
}
async function resolveWorkspace(event:APIGatewayProxyEventV2):Promise<string>{
  const email=googleIdentity(event).email;
  const path=event.rawPath.replace(/^\/api/,'');
  if(path==='/join'){
    const code=normalizeInviteCode(String(bodyOf(event).code||''));
    if(!/^[A-F0-9]{24}$/.test(code))return DEFAULT_WORKSPACE;
    for(const w of await workspaceList()){
      const invite=await withWorkspace(w.id,()=>get('INVITE#CURRENT'));
      if(invite?.codeHash===codeHash(code))return w.id;
    }
    return DEFAULT_WORKSPACE;
  }
  if(path.startsWith('/admin/'))return DEFAULT_WORKSPACE;
  const requested=String(event.headers?.['x-workspace-id']||'').trim();
  const allowed=await accountWorkspaces(email);
  if(requested){if(!allowed.some(w=>w.id===requested))throw bad('이 수업에 접근할 수 없습니다.',403);return requested;}
  if(!allowed.length)return DEFAULT_WORKSPACE;
  return allowed.find(w=>w.id===DEFAULT_WORKSPACE)?.id||allowed[0].id;
}
export async function handler(event:APIGatewayProxyEventV2):Promise<APIGatewayProxyStructuredResultV2>{
  try{
    const path=event.rawPath.replace(/^\/api/,'');
    if(path==='/config')return processRequest(event);
    const selected=await resolveWorkspace(event);
    return await withWorkspace(selected,async()=>{
      const response=await processRequest(event);
      const method=event.requestContext.http.method;
      const action=method==='GET'?'':auditAction(method,path);
      if(action&&Number(response.statusCode)<300){
        try{
          const at=now(),actorEmail=googleIdentity(event).email;
          const actor=data<Member>(await get(`MEMBER#${actorEmail}`));
          const notification=actor?await studentNotification(action,actor,path,response):'none';
          await put(item(`AUDIT#${at}#${randomUUID()}`,{at,actorEmail,action,target:path.slice(0,200),notification}));
        }catch(error){console.error('Audit write failed',error);}
      }
      return response;
    });
  }catch(error:any){if(!error.status)console.error(error);return json(error.status||500,{error:error.status?error.message:'요청을 처리하지 못했습니다.'});}
}
