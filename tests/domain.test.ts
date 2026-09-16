import test from 'node:test';
import assert from 'node:assert/strict';
import { seedWeeks, rotateAssignees, validateSessionParts, parseQuizHtml, gradeQuiz, validateQuizItems, type Member, type Week, type Question } from '../shared/domain.js';
import { canEditProgress, canResolveQuestion, canRsvp, canViewWeek, canWriteReport } from '../shared/access.js';

const tutor:Member={id:'tutor',name:'튜터',email:'tutor@example.com',role:'tutor',active:true,createdAt:'2026-09-01'};
const student:Member={id:'s1',name:'튜티',email:'s1@example.com',role:'student',active:true,createdAt:'2026-09-01'};
const rep:Member={...student,id:'rep',role:'rep'};
const quiz=Array.from({length:5},(_,i)=>({id:String(i+1),question:`질문 ${i+1}`,choices:['A','B','C','D'],answer:i%4,explanation:'정답 근거'}));

test('화요일 10회 일정에 10월 20일 시험기간 휴식이 반영된다',()=>{
  assert.equal(seedWeeks.length,10);
  assert.deepEqual(seedWeeks.map(w=>w.date),['2026-09-22','2026-09-29','2026-10-06','2026-10-13','2026-10-27','2026-11-03','2026-11-10','2026-11-17','2026-11-24','2026-12-01']);
  assert.ok(seedWeeks.every(w=>!w.published&&w.time==='11:00'&&w.duration===50&&w.location.includes('전날 웹 공지')));
});
test('발표 파트는 4~5명의 서로 다른 튜티에게 5~10분씩 배정한다',()=>{
  const ids=['a','b','c','d','e'];
  const four=ids.slice(0,4).map((memberId,i)=>({id:String(i),memberId,title:`파트 ${i+1}`,minutes:5+Math.min(i,2)}));
  assert.equal(validateSessionParts(four,ids).length,4);
  assert.equal(validateSessionParts([...four,{id:'4',memberId:'e',title:'마무리',minutes:5}],ids).length,5);
  assert.throws(()=>validateSessionParts([...four,{id:'4',memberId:'e',title:'마무리',minutes:10}],ids));
  assert.throws(()=>validateSessionParts(four.slice(0,3),ids));
  assert.throws(()=>validateSessionParts([...four.slice(0,3),{...four[3],memberId:'a'}],ids));
  assert.throws(()=>validateSessionParts([...four.slice(0,3),{...four[3],minutes:11}],ids));
});
test('5명이 보고서를 정확히 두 번씩 맡는다',()=>{
  const assigned=rotateAssignees(['a','b','c','d','e']);
  assert.equal(assigned.length,10);
  for(const id of ['a','b','c','d','e'])assert.equal(assigned.filter(x=>x===id).length,2);
  assert.throws(()=>rotateAssignees(['a','a','b','c','d']));
});
test('권한은 화면과 별도로 역할·공개·담당자를 검사한다',()=>{
  const draft:Week={...seedWeeks[0],reportMemberId:student.id};
  const published={...draft,published:true};
  assert.equal(canViewWeek(student,draft),false);
  assert.equal(canViewWeek(tutor,draft),true);
  assert.equal(canEditProgress(rep,draft),false);
  assert.equal(canEditProgress(rep,published),true);
  assert.equal(canEditProgress(student,published),false);
  assert.equal(canWriteReport(student,draft),false);
  assert.equal(canWriteReport(student,published),true);
  assert.equal(canWriteReport(rep,published),false);
  assert.equal(canRsvp(student,draft),false);
  assert.equal(canRsvp(student,published),true);
  assert.equal(canRsvp(tutor,published),false);
  const question:Question={id:'q',title:'질문',body:'본문',authorId:student.id,createdAt:'',resolved:false,replies:[]};
  assert.equal(canResolveQuestion(student,question),true);
  assert.equal(canResolveQuestion(rep,question),false);
  assert.equal(canResolveQuestion(tutor,question),true);
});
test('HTML 템플릿에서 유효한 다섯 문항만 가져오고 서버에서 채점한다',()=>{
  const html=`<html><script>alert('not executed')</script><script id="quiz-data" type="application/json">${JSON.stringify(quiz)}</script></html>`;
  const parsed=parseQuizHtml(html);
  assert.equal(parsed.length,5);
  const result=gradeQuiz(parsed,[0,1,2,3,0]);
  assert.equal(result.score,5);
  assert.equal(result.details[0].answer,0);
  assert.throws(()=>gradeQuiz(parsed,[0,1]));
  assert.throws(()=>validateQuizItems([{question:'x'}]));
  assert.throws(()=>parseQuizHtml('<script>alert(1)</script>'));
});
