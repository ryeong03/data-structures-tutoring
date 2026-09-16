export type Role = 'tutor' | 'rep' | 'student';
export type Member = { id: string; email: string; name: string; role: Role; active: boolean; createdAt: string };
export type PublicMember = Pick<Member,'id'|'name'|'role'>;
export type SessionPart = { id: string; title: string; memberId: string; minutes: number };
export type Week = { id: number; date: string; time: string; duration: number; location: string; topic: string; concepts: string; published: boolean; cleared: boolean; sessionParts: SessionPart[]; reportMemberId?: string; progressMaterialId?: string; progressPage?: number; actualDate?: string };
export type Notice = { id: string; title: string; body: string; createdAt: string; pinned: boolean };
export type Material = { id: string; weekId: number; name: string; key: string; size: number; createdAt: string };
export type Report = { weekId: number; authorId: string; content: string; status: 'draft' | 'submitted'; updatedAt: string; submittedAt?: string };
export type Question = { id: string; title: string; body: string; authorId: string; createdAt: string; resolved: boolean; replies: Reply[] };
export type Reply = { id: string; body: string; authorId: string; createdAt: string };
export type QuizItem = { id: string; question: string; choices: [string,string,string,string]; answer: number; explanation: string };
export type Quiz = { weekId: number; title: string; concepts: string; status: 'draft' | 'published'; items: QuizItem[]; source: 'ai' | 'html' | 'manual'; updatedAt: string };
export type QuizPublic = Omit<Quiz,'items'> & { items: Omit<QuizItem,'answer' | 'explanation'>[] };
export type Attempt = { weekId: number; memberId: string; at: string; answers: number[]; score: number };
export type TutorWeek = { weekId: number; attendance: Record<string,boolean>; notes: string };
export type Rsvp = { weekId: number; memberId: string; status: 'yes' | 'no'; reason?: string; updatedAt: string };
export const kickoffNotice: Notice = {
  id: 'kickoff-2026',
  title: '9월 17일 18:30 첫 미팅 안내',
  body: '9월 17일(목) 18:30에 Zoom으로 첫 미팅을 진행합니다. 서로 소개하고 튜터링 방식과 일정을 안내할게요. Zoom 링크는 「Zoom 모임」 탭에서 확인해 주세요.\n\n정규 튜터링은 화요일 11:00~11:50에 진행합니다. 장소는 공간 대여 현황에 따라 정하고, 모임 전날 이 웹사이트에 공지하겠습니다. 일부 모임은 비대면으로 진행할 수 있습니다.',
  createdAt: '2026-09-16T00:00:00+09:00',
  pinned: true
};
export const seedWeeks: Week[] = [
  ['2026-09-22','자료구조 기초 · 재귀 · 배열/포인터','성능 분석, 재귀, 배열, 구조체, 동적 메모리',50],
  ['2026-09-29','리스트 · 연결 리스트','배열 리스트, 단일/이중 연결 리스트, 삽입과 삭제',50],
  ['2026-10-06','스택 · 큐 · 트리 기초','스택/큐 구현과 활용, 이진 트리',50],
  ['2026-10-13','트리 · BST · 중간고사 대비','트리 순회, BST 삽입/삭제, 시간 복잡도',50],
  ['2026-10-27','우선순위 큐 · 힙','힙, heapify, 우선순위 큐의 복잡도',50],
  ['2026-11-03','정렬','선택/삽입/버블/합병/퀵정렬, 안정성',50],
  ['2026-11-10','그래프 · DFS/BFS','인접행렬/리스트, 깊이/너비 우선 탐색',50],
  ['2026-11-17','최소 신장 트리','Prim, Kruskal, 유니온파인드',50],
  ['2026-11-24','최단 경로 · 위상 정렬 · 해싱','Dijkstra, DAG, 해시 함수와 충돌',50],
  ['2026-12-01','해싱 · 탐색 · 기말 대비','오버플로, 이진/인덱스/트리 탐색, 자료구조 선택',50]
].map(([date,topic,concepts,duration],i)=>({id:i+1,date:String(date),time:'11:00',location:'공간 대여 확인 후 전날 웹 공지',topic:String(topic),concepts:String(concepts),duration:Number(duration),published:false,cleared:false,sessionParts:[]}));

export function rotateAssignees(memberIds: string[]): string[] {
  if (memberIds.length !== 5 || new Set(memberIds).size !== 5) throw new Error('튜티 5명이 필요합니다.');
  return Array.from({length:10},(_,i)=>memberIds[i%5]);
}
export function validateSessionParts(value: unknown, memberIds: string[]): SessionPart[] {
  if (!Array.isArray(value) || value.length!==0 && (value.length<4 || value.length>5)) throw new Error('발표 파트는 4~5개로 구성해 주세요.');
  const permitted=new Set(memberIds);
  const seenMembers=new Set<string>();
  const seenIds=new Set<string>();
  const parts=value.map((part,i)=>{
    if (!part || typeof part!=='object') throw new Error(`${i+1}번 발표 파트를 확인해 주세요.`);
    const x=part as Record<string,unknown>;
    if (typeof x.id!=='string'||!x.id||x.id.length>100||seenIds.has(x.id)||typeof x.title!=='string'||!x.title.trim()||x.title.length>160||typeof x.memberId!=='string'||!permitted.has(x.memberId)||seenMembers.has(x.memberId)||!Number.isInteger(x.minutes)||Number(x.minutes)<5||Number(x.minutes)>10) throw new Error(`${i+1}번 발표 파트의 주제, 담당자, 시간을 확인해 주세요.`);
    seenIds.add(x.id);seenMembers.add(x.memberId);
    return {id:x.id,title:x.title.trim(),memberId:x.memberId,minutes:Number(x.minutes)};
  });
  if(parts.reduce((sum,part)=>sum+part.minutes,0)>30)throw new Error('50분 튜터링을 위해 발표 시간 합계는 30분 이내로 해주세요.');
  return parts;
}
export function validateQuizItems(value: unknown): QuizItem[] {
  if (!Array.isArray(value) || value.length !== 5) throw new Error('객관식 문항은 정확히 5개여야 합니다.');
  return value.map((item,i)=>{
    if (!item || typeof item !== 'object') throw new Error(`${i+1}번 문항 형식이 잘못되었습니다.`);
    const x=item as Record<string,unknown>;
    if (typeof x.question !== 'string' || !x.question.trim() || !Array.isArray(x.choices) || x.choices.length !== 4 || !x.choices.every(c=>typeof c==='string' && c.trim()) || !Number.isInteger(x.answer) || Number(x.answer)<0 || Number(x.answer)>3 || typeof x.explanation !== 'string' || !x.explanation.trim()) throw new Error(`${i+1}번 문항을 확인해 주세요.`);
    return {id:String(x.id||i+1),question:x.question.trim(),choices:x.choices as QuizItem['choices'],answer:Number(x.answer),explanation:x.explanation.trim()};
  });
}
export function parseQuizHtml(html: string): QuizItem[] {
  const matches=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)];
  const block=matches.find(m=>/\bid\s*=\s*["']quiz-data["']/i.test(m[1]) && /\btype\s*=\s*["']application\/json["']/i.test(m[1]));
  if (!block) throw new Error('공통 템플릿의 quiz-data 블록을 찾지 못했습니다.');
  let data:unknown;try{data=JSON.parse(block[2]);}catch{throw new Error('quiz-data JSON을 읽을 수 없습니다.');}
  return validateQuizItems(data);
}
export function gradeQuiz(items: QuizItem[], answers: number[]) {
  if (answers.length!==5 || !answers.every(a=>Number.isInteger(a)&&a>=0&&a<4)) throw new Error('모든 문항에 답해 주세요.');
  return {score:items.reduce((n,item,i)=>n+Number(item.answer===answers[i]),0),details:items.map((item,i)=>({question:item.question,answer:item.answer,chosen:answers[i],explanation:item.explanation,choices:item.choices}))};
}
