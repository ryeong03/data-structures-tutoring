import type { State } from './state.js';

export function studentPreview(state:State,memberId:string):State|null{
  const member=memberId==='sample-student'?{id:'sample-student',name:'예시 튜티',role:'student' as const}:state.members.find(m=>m.id===memberId&&m.role!=='tutor');
  if(!member)return null;
  const weeks=state.weeks.filter(w=>w.published);
  const visibleWeeks=new Set(weeks.map(w=>w.id));
  const attempts=state.attempts.filter(a=>a.memberId===member.id&&visibleWeeks.has(a.weekId));
  const tried=new Set(attempts.map(a=>a.weekId));
  const quizzes=state.quizzes.filter(q=>q.status==='published'&&visibleWeeks.has(q.weekId)).map(q=>tried.has(q.weekId)?q:{...q,items:q.items.map(({id,question,choices})=>({id,question,choices}))}) as State['quizzes'];
  return {
    workspace:state.workspace&&{id:state.workspace.id,name:state.workspace.name,tutorName:state.workspace.tutorName,active:state.workspace.active},
    me:{id:member.id,name:member.name,role:member.role,email:'email' in member&&typeof member.email==='string'?member.email:undefined},
    members:state.members.filter(m=>!('active' in m)||m.active).map(({id,name,role})=>({id,name,role})),
    weeks,
    notices:state.notices,
    materials:state.materials.filter(m=>visibleWeeks.has(m.weekId)),
    questions:state.questions,
    reports:state.reports.filter(r=>visibleWeeks.has(r.weekId)&&(r.status==='submitted'||r.authorId===member.id)),
    quizzes,
    attempts,
    rsvps:state.rsvps.filter(r=>r.memberId===member.id&&visibleWeeks.has(r.weekId)),
    config:state.config
  };
}
