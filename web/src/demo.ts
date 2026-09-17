import { seedWeeks, kickoffNotice, gradeQuiz, parseQuizHtml, validateQuizItems, type Member, type Notice, type Question, type Quiz, type Report, type Week, type Material, type Rsvp } from '../../shared/domain';
import type { State, Workspace } from './state';

const names=['Sample student 1','Sample student 2','Sample student 3','Sample student 4','Sample student 5'];
const members:Member[]=[{id:'tutor',email:'tutor@example.invalid',name:'박세령',role:'tutor',active:true,createdAt:'2026-09-01'},...names.map((name,i)=>({id:`student-${i+1}`,email:`student-${i+1}@example.invalid`,name,role:'student' as const,active:true,createdAt:`2026-09-0${i+2}`}))];
export function setDemoNames(previewNames:string[]){
  if(previewNames.length!==5||!previewNames.every(name=>typeof name==='string'&&name.trim().length>0&&name.length<=80))return;
  previewNames.forEach((name,i)=>{members[i+1].name=name.trim();});
}
const weeks:Week[]=seedWeeks.map((w,i)=>({...w,published:i<2}));
const files:[number,string,number][]=[[1,'sample-basics.pdf',170000],[2,'sample-lists.pdf',200000]];
const materials:Material[]=files.map(([weekId,name,size],i)=>({id:`demo-${i+1}`,weekId,name,key:`demo-materials/${i+1}`,size,createdAt:'2026-09-16T08:00:00Z'}));
const notices:Notice[]=[kickoffNotice];
const questions:Question[]=[];const reports:Report[]=[];const quizzes:Quiz[]=[];const attempts:any[]=[];const rsvps:Rsvp[]=[];
let zoomUrl='',inviteActive=false;
const activityLog:NonNullable<State['activityLog']>=[];
const demoWorkspace:Workspace={id:'default',name:'자료구조 튜터링',tutorEmail:'tutor@example.invalid',tutorName:'박세령',createdAt:'2026-09-17',active:true,studentCount:5,materialCount:2,publishedWeeks:2};
export const demoState=():State=>({workspace:demoWorkspace,workspaces:[demoWorkspace],isAdmin:true,me:members[0],members:[...members],weeks:[...weeks],notices:[...notices],materials:[...materials],questions:[...questions],reports:[...reports],quizzes:[...quizzes],attempts:[...attempts],rsvps:[...rsvps],config:{zoomUrl},tutorWeeks:[],activityLog:[...activityLog],inviteActive});
export async function demoApi(path:string,method='GET',data:any={}):Promise<any>{
  if(path==='/state')return demoState();
  if(path==='/admin/workspaces'&&method==='GET')return [demoWorkspace];
  if(path==='/admin/workspaces'&&method==='POST')throw new Error('실제 Google 계정을 초대하려면 배포된 사이트에서 진행해 주세요.');
  const file=path.match(/^\/materials\/demo-(\d+)\/url$/);if(file&&method==='GET')throw new Error('교수님 PDF는 실제 로그인 후에만 열 수 있습니다.');
  if(path==='/config'&&method==='PUT'){zoomUrl=data.zoomUrl;return {ok:true};}
  if(path==='/invite-code'&&method==='POST'){inviteActive=true;return {code:'A1B2-C3D4-E5F6-1234-5678-9ABC'};}
  let rsvpMatch=path.match(/^\/weeks\/(\d+)\/rsvp$/);if(rsvpMatch&&method==='PUT'){const weekId=Number(rsvpMatch[1]);rsvps.splice(0,rsvps.length,...rsvps.filter(r=>r.weekId!==weekId||r.memberId!=='tutor'));const rsvp:Rsvp={weekId,memberId:'tutor',status:data.status,...(data.reason?{reason:data.reason}:{}),updatedAt:new Date().toISOString()};rsvps.push(rsvp);return rsvp;}
  if(path==='/notices'&&method==='POST'){notices.unshift({id:crypto.randomUUID(),title:data.title,body:data.body,pinned:false,createdAt:new Date().toISOString()});return {ok:true};}
  if(path.startsWith('/notices/')&&method==='DELETE'){notices.splice(notices.findIndex(n=>n.id===path.split('/')[2]),1);return {ok:true};}
  let match=path.match(/^\/weeks\/(\d+)$/);if(match&&method==='PATCH'){const w=weeks.find(x=>x.id===Number(match![1]));if(w)Object.assign(w,data);return {ok:true};}
  match=path.match(/^\/questions\/([^/]+)\/replies$/);if(match&&method==='POST'){const q=questions.find(x=>x.id===match![1]);q?.replies.push({id:crypto.randomUUID(),body:data.body,authorId:'tutor',createdAt:new Date().toISOString()});return {ok:true};}
  match=path.match(/^\/questions\/([^/]+)$/);if(match&&method==='PATCH'){const q=questions.find(x=>x.id===match![1]);if(q)q.resolved=!!data.resolved;return {ok:true};}
  if(path==='/questions'&&method==='POST'){questions.unshift({id:crypto.randomUUID(),title:data.title,body:data.body,authorId:'tutor',createdAt:new Date().toISOString(),resolved:false,replies:[]});return {ok:true};}
  match=path.match(/^\/reports\/(\d+)$/);if(match&&method==='PUT'){const id=Number(match[1]);reports.splice(0,reports.length,...reports.filter(r=>r.weekId!==id));reports.push({weekId:id,authorId:'tutor',content:data.content,status:data.status,updatedAt:new Date().toISOString()});return {ok:true};}
  match=path.match(/^\/quizzes\/(\d+)\/html$/);if(match&&method==='POST'){const id=Number(match[1]);const q:Quiz={weekId:id,title:weeks[id-1].topic,concepts:weeks[id-1].concepts,status:'draft',source:'html',updatedAt:new Date().toISOString(),items:parseQuizHtml(data.html)};quizzes.splice(0,quizzes.length,...quizzes.filter(x=>x.weekId!==id));quizzes.push(q);return q;}
  match=path.match(/^\/quizzes\/(\d+)\/json$/);if(match&&method==='POST'){const id=Number(match[1]);const parsed=JSON.parse(data.json);const q:Quiz={weekId:id,title:weeks[id-1].topic,concepts:weeks[id-1].concepts,status:'draft',source:'manual',updatedAt:new Date().toISOString(),items:validateQuizItems(Array.isArray(parsed)?parsed:parsed.items)};quizzes.splice(0,quizzes.length,...quizzes.filter(x=>x.weekId!==id));quizzes.push(q);return q;}
  match=path.match(/^\/quizzes\/(\d+)\/generate$/);if(match&&method==='POST')throw new Error('로컬 미리보기에서는 Claude API가 호출되지 않습니다.');
  match=path.match(/^\/quizzes\/(\d+)$/);if(match&&method==='PUT'){const q=quizzes.find(x=>x.weekId===Number(match![1]));if(q)Object.assign(q,data,{updatedAt:new Date().toISOString()});return q;}
  match=path.match(/^\/quizzes\/(\d+)\/attempts$/);if(match&&method==='POST'){const q=quizzes.find(x=>x.weekId===Number(match![1]));if(!q)throw new Error('퀴즈가 없습니다.');const result=gradeQuiz(q.items,data.answers);const attempt={weekId:q.weekId,memberId:'tutor',at:new Date().toISOString(),answers:data.answers,score:result.score};attempts.push(attempt);return {...attempt,details:result.details};}
  if(path==='/members'&&method==='POST')throw new Error('로컬 미리보기에서는 실제 Google 계정을 초대할 수 없습니다.');
  if(path.startsWith('/members/')&&method==='PATCH'){const m=members.find(x=>x.email===decodeURIComponent(path.split('/')[2]));if(m){if(data.role==='rep')members.forEach(x=>{if(x.role==='rep')x.role='student';});Object.assign(m,data);}return m;}
  if(path.startsWith('/members/')&&method==='DELETE'){const index=members.findIndex(x=>x.email===decodeURIComponent(path.split('/')[2]));if(index>=0){const [removed]=members.splice(index,1);weeks.forEach(w=>{if(w.reportMemberId===removed.id)w.reportMemberId=undefined;});}return {ok:true};}
  if(path.startsWith('/tutor-weeks/')&&method==='PUT')return {ok:true};
  if(path==='/export')throw new Error('실제 AWS 저장소가 연결된 뒤 백업할 수 있습니다.');
  throw new Error('로컬 미리보기에서 지원하지 않는 기능입니다.');
}
