import { ru, kk } from './i18n-extra';

export type Language='ko'|'en'|'ru'|'kk';
export const locale=()=>({ko:'ko-KR',en:'en-US',ru:'ru-RU',kk:'kk-KZ'}[document.documentElement.lang]||'ko-KR');

const en:Record<string,string>={
  'HTML 템플릿으로 퀴즈 초안을 올려주세요.':'Upload a quiz draft using the HTML template.',
  '각자 사용하는 AI에서 문항을 만든 뒤 결과만 이곳에 붙여 넣으세요. API 키는 사이트에 입력하지 않습니다. PDF를 참고할 때는 AI 도구에 직접 첨부하세요.':'Create the questions in your own AI tool, then paste only the result here. Do not enter your API key on this site. Attach a PDF directly in your AI tool if needed.',
  '생성 프롬프트 복사':'Copy generation prompt','5문항 JSON 붙여 넣기':'Paste five-question JSON','JSON 초안 가져오기':'Import JSON draft','또는 HTML 파일':'or an HTML file',
  '이전 AI 퀴즈 생성 기록입니다. 현재 자동 생성은 중지 상태입니다.':'Previous AI quiz generation records. Automatic generation is currently unavailable.',
  '퀴즈 생성 프롬프트를 복사했습니다.':'Quiz generation prompt copied.','JSON 퀴즈 초안을 불러왔습니다.':'JSON quiz draft imported.',
  'PDF 첨부 (선택)':'Attach PDF (optional)','올리는 중…':'Uploading…','사이트에서 보기':'View here','여는 중…':'Opening…','새 탭에서 열기 ↗':'Open in new tab ↗',
  '10주 탐험':'10 WEEK JOURNEY',
  '각 수업의 튜터와 가입코드를 받은 튜티 최대 5명이 이용할 수 있습니다.':'Each class is for its tutor and up to five students with a join code.',
  '전체 수업 관리':'All classrooms','수업 공간':'Classrooms','튜터 수업 추가':'Add tutor classroom','수업 공간 만들기':'Create classroom','수업 열기 ↗':'Open classroom ↗','튜터 이름':'Tutor name','튜터 Google 이메일':'Tutor Google email','수업 이름':'Classroom name','온라인 모임':'Online meeting','튜터가 Zoom 링크를 등록하면 이곳에서 바로 입장할 수 있어요.':'Join here once the tutor adds a Zoom link.',
  '화요일 11:00 ~ 11:50':'Tuesday 11:00–11:50','장소는 전날 웹 공지':'Venue posted here the day before',
  '화요일 11:00 · 장소는 전날 웹 공지':'Tuesday 11:00 · venue posted here the day before',
  '화요일 11:00–11:50 · 장소는 전날 웹 공지':'Tuesday 11:00–11:50 · venue posted here the day before',
  '공간 대여 확인 후 전날 웹 공지':'Venue posted here the day before after room booking',
  '에 시작해요. 장소는 공간 대여 확인 후 모임 전날 이 웹사이트에 공지합니다.':'. The venue will be posted here the day before, after room booking is confirmed.',
  '9월 17일(목) 18:30에 Zoom으로 첫 미팅을 진행합니다. 서로 소개하고 튜터링 방식과 일정을 안내할게요. Zoom 링크는 「Zoom 모임」 탭에서 확인해 주세요.\n\n정규 튜터링은 화요일 11:00~11:50에 진행합니다. 장소는 공간 대여 현황에 따라 정하고, 모임 전날 이 웹사이트에 공지하겠습니다. 일부 모임은 비대면으로 진행할 수 있습니다.':'Our first Zoom meeting is Thursday, Sep 17 at 18:30. We will introduce ourselves and explain how tutoring and the schedule will work. Find the link in the Zoom Meeting tab.\n\nRegular sessions are Tuesdays from 11:00 to 11:50. The venue depends on room availability and will be posted on this website the day before. Some sessions may be online.',
  '분':'min',
  'FIELD GUIDE · 2026 2학기':'FIELD GUIDE · 2026 Semester 2','FIRST MEETING · 2026 2학기':'FIRST MEETING · 2026 Semester 2',
  '보고서 담당:':'Report writer:','참석 어려움 · 사유 남기기':'Cannot attend · give a reason','참석이 어려운 사유':'Reason you cannot attend','사유와 함께 제출':'Submit with reason','사유:':'Reason:','일정이 겹치거나 참석이 어려운 이유를 적어주세요.':'Tell us why you cannot attend.','주차 학습 보고서':'weekly learning report','공개된 주차':'Published weeks','/ 10 · 일정과 주제는 튜터가 확인한 뒤 공개합니다.':'/ 10 · Dates and topics appear after the tutor reviews them.','무엇이 궁금한가요?':'What would you like to ask?','어디에서 막혔는지, 시도해 본 방법이 있다면 함께 적어주세요.':'Where did you get stuck? What have you tried?','세령 튜터와 함께!':'Let’s go with the tutor!',
  '자료구조, 함께 배워요.':'Learn data structures together.','매주 배운 내용을 서로 설명하고, 질문하며, 한 주씩 나아가요.':'Each week, we explain what we learned, ask questions, and move forward together.',
  '자료구조 튜터링':'Data Structures Tutoring','자료구조 탐험 지도':'Data Structures Adventure Map','2026 · 2학기':'2026 · Semester 2','2026 2학기 · 10주':'2026 Semester 2 · 10 weeks','2026 2학기':'2026 Semester 2',
  '홈':'Home','로그아웃':'Log out','메뉴':'Menu','닫기':'Close','주요 메뉴':'Main navigation','공지사항 보기 ↗':'View announcements ↗','지도를 옆으로 넘겨보세요 →':'Swipe the map sideways →','운영계획':'How We Learn','일정·자료':'Schedule & Materials','Zoom 모임':'Zoom Meeting','주별보고서':'Weekly Reports','질문방':'Questions','개념 퀴즈':'Concept Quiz','튜터 전용':'Tutor Only','활동 로그':'Activity Log','우리의 학습 공간':'Our learning space','로컬 미리보기':'Local Preview',
  '공간을 여는 중…':'Opening your space…','데이터를 불러오지 못했습니다.':'Could not load the data.','이번 주 튜터링을':'See this week’s tutoring','한곳에서 확인하세요.':'all in one place.','일정과 자료를 확인하고, 질문하고, 이번 주 개념을 직접 풀어보세요.':'Check the schedule and materials, ask questions, and try this week’s concepts.','접근이 중지된 계정입니다. 튜터에게 문의해 주세요.':'This account has been disabled. Please contact the tutor.','Google 계정으로 시작하기':'Continue with Google','튜터와 가입코드를 받은 튜티 5명만 이용할 수 있습니다.':'For the tutor and five students with a join code.','팀에 들어오세요':'Join the team','Google 로그인은 완료됐어요. 튜터에게 받은 가입코드를 한 번만 입력하면 됩니다.':'Google sign-in is complete. Enter the join code from your tutor once.','표시할 이름':'Display name','가입코드':'Join code','팀에 가입하기':'Join the team','다른 Google 계정으로 로그인':'Use a different Google account',
  '튜티 화면 미리보기':'Preview student view','내 화면 보기':'My view','예시 튜티':'Sample student','화면 미리보기 · 저장되지 않습니다':'preview · changes will not be saved','내 화면으로 돌아가기':'Return to my view','튜터':'Tutor','대표튜티':'Student representative','튜티':'Student',
  '자료구조 튜터링은':'Data Structures Tutoring','이렇게 진행해요':'works like this','튜티가 서로 설명하고, 튜터가 핵심을 정리한 뒤 질문으로 마무리합니다.':'Students explain to one another, the tutor summarizes key ideas, and we end with questions.','화요일 11:00 · 장소 추후 안내':'Tuesday 11:00 · venue to be announced','모임 전':'Before the session','퀴즈와 준비':'Quiz and preparation','5문항 개념 퀴즈를 풀고, PDF와 맡은 발표 파트를 읽어요.':'Take a five-question quiz and review the PDF and your part.','튜티 발표':'Student explanations','서로 설명하기':'Explain together','4~5명이 그 주 배운 내용을 나눠 각자 5~10분씩 설명해요.':'Four or five students each explain part of the week’s material for 5–10 minutes.','파트마다':'After each part','튜터 핵심 정리':'Tutor summary','각 설명 뒤 빠진 개념을 보충하고 중요한 부분을 짚어요.':'The tutor fills gaps and highlights important concepts after each explanation.','마지막 10분':'Final 10 minutes','함께 질문하기':'Questions together','남은 질문을 풀고, 이어질 질문은 질문방에 남겨요.':'We answer remaining questions and continue in the question board.','모임 후 기록':'After the session','대표튜티는 자료·페이지를, 담당 튜티는 주별보고서를 기록해요.':'The representative records the material and page reached; the assigned student writes the weekly report.','보고서 담당':'Report rotation','5명 확정 시 1인당 2회씩 맡아요.':'Once all five students join, each writes two reports.','쉬어 가는 주':'Break week','10월 20일 · 시험기간 휴강':'Oct 20 · exam break',
  '길을 따라 주차를 선택하세요. 게시판에서는 공지사항을 볼 수 있어요.':'Follow the path to choose a week. Open the board for announcements.','완료한 주차':'Weeks completed','완료':'Completed','진행할 주차':'Current week','공개 대기':'Coming soon','지금 여기':'You are here','공지사항':'Announcements','게시판 열기 ↗':'Open board ↗','첫 미팅 · Zoom':'First meeting · Zoom','다음 튜터링 참석 여부':'Attendance for the next session','참석 여부':'Attendance','참석 가능':'Can attend','참석 어려움':'Cannot attend','미응답':'No response','명 응답':'responses','응답을 바꿀 수 있어요.':'You can change your answer.','다음 튜터링에 참석할 수 있나요?':'Can you attend the next tutoring session?','아직 가입한 튜티가 없습니다.':'No students have joined yet.','화요일 11:00 ~ 11:50 · 장소 추후 안내':'Tuesday 11:00–11:50 · venue TBA','10/20 시험기간 휴강':'Oct 20 exam break','이화사이버캠퍼스 ↗':'Ewha Cyber Campus ↗','사이버캠퍼스 ↗':'Cyber Campus ↗','이 주차 자료 보기 ↗':'View materials for this week ↗','진도 기록 전':'Progress not recorded','10월 20일은 시험기간 휴강 · 다음 튜터링은 10월 27일':'Oct 20 is an exam break · next session is Oct 27','공지 올리기':'Post announcement','삭제':'Delete','Zoom 회의실 ↗':'Zoom meeting ↗',
  '먼저 만나서 인사해요':'Let’s meet first','첫 미팅에서는 서로 소개하고, 튜터링 방식과 앞으로의 일정을 함께 안내합니다.':'We’ll introduce ourselves and go over how tutoring and the schedule will work.','목요일':'Thursday','18:30 시작':'Starts at 18:30','Zoom 온라인 모임':'Online on Zoom','Zoom 회의실 들어가기 ↗':'Join Zoom meeting ↗','Zoom 링크를 받으면 이곳에서 바로 들어갈 수 있어요.':'Once the Zoom link arrives, you can join from here.','팀원에게 보여줄 Zoom 링크':'Zoom link for the team','링크 저장':'Save link','정규 튜터링은':'Regular tutoring starts','9월 22일 화요일 11:00':'Tuesday, Sep 22 at 11:00','에 시작해요. 장소는 첫 미팅에서 안내합니다.':'. We’ll confirm the venue at the first meeting.',
  '날짜':'Date','시간':'Time','길이(분)':'Duration (minutes)','수업 길이':'Session length','장소':'Venue','주제':'Topic','핵심 개념':'Key concepts','보고서 담당자':'Report writer','이번 주차 완료로 표시 (지도에 반영)':'Mark this week complete on the map','팀원에게 이 주차 공개':'Publish this week to the team','일정 저장':'Save schedule','학습자료와 진도':'Materials & progress','현재 진도:':'Current progress:','PDF 올리기':'Upload PDF','진도 자료':'Material covered','마지막 페이지':'Last page reached','진도 기록':'Save progress','공개':'Published','잠정':'Tentative','미정':'TBA','시간 미정':'Time TBA','선택':'Select','자료':'Material','담당자 미정':'Writer TBD','날짜 미정':'Date TBD','보고서 담당자 미정':'Report writer TBD',
  '학습 내용과 느낀 점':'What you learned and noticed','초안 저장':'Save draft','보고서 제출':'Submit report','제출 완료':'Submitted','작성 중':'In progress','작성 대기':'Waiting to start','작성 담당:':'Assigned writer:','각 튜티가 두 번씩 작성합니다. 담당자 변경은 튜터가 일정·자료에서 할 수 있어요.':'Each student writes twice. The tutor can change the assignment in Schedule & Materials.','아직 작성된 보고서가 없습니다.':'No report has been written yet.',
  '새 질문':'New question','질문 올리기':'Post question','질문 목록':'Questions','질문 중':'Open','해결':'Resolved','답글 달기':'Reply','다시 열기':'Reopen','해결로 표시':'Mark resolved','아직 질문이 없습니다. 첫 질문을 남겨보세요.':'No questions yet. Start the discussion.',
  '준비 중':'In preparation','풀이 기록':'Quiz attempts','답안 제출 · 바로 채점':'Submit answers · grade now','정답':'Correct answer','오답':'Incorrect','문항 검토':'Review questions','퀴즈 초안 만들기':'Create quiz draft','AI 생성은 버튼을 누를 때만 실행됩니다. 생성 결과는 공개 전까지 팀원에게 보이지 않습니다.':'AI runs only when you press the button. The draft stays private until you publish it.','참고 PDF':'Reference PDF','PDF 없이 생성':'Generate without PDF','Claude로 5문항 생성':'Generate 5 questions with Claude','또는':'or','HTML 퀴즈 가져오기':'Import HTML quiz','HTML 공통 템플릿 받기 ↓':'Download HTML template ↓','정답 근거':'Why this answer is correct','해설':'Explanation','튜티에게 공개':'Publish to students','공개된 퀴즈 주차가 없습니다.':'No quiz weeks are published yet.','AI로 초안을 만들거나 HTML 템플릿을 올려주세요.':'Generate a draft with AI or upload the HTML template.','퀴즈가 아직 공개되지 않았습니다.':'The quiz has not been published yet.',
  '팀원과 가입코드':'Members & join code','튜티에게 가입코드를 알려주세요. 각자 Google 계정으로 로그인한 뒤 코드를 입력하면 팀에 들어옵니다. 다섯 명이 가입하면 보고서 담당을 각 2회씩 배정합니다.':'Share the join code with students. They sign in with Google and enter it once. When five students have joined, each receives two report assignments.','가입코드 발급':'Create join code','새 가입코드 발급':'Create a new join code','코드 복사':'Copy code','기존 코드는 보안상 다시 볼 수 없습니다. 잃어버렸다면 새 코드를 발급해 주세요.':'For security, the current code cannot be shown again. Create a new one if you lost it.','튜티 명단 · 튜터만 열람':'Student roster · tutor only','참여 여부 미정':'Participation unconfirmed','참여 예정':'Expected to join','출석과 세션 메모':'Attendance & session notes','주차':'Week','세션 메모':'Session notes','기록 저장':'Save record','보고서 제출 현황':'Report status','초안 작성 중':'Draft in progress','미제출':'Not submitted','Claude 사용 기록':'Claude usage','퀴즈 초안 생성 요청만 기록합니다. API 요금은 AWS 크레딧과 별도입니다.':'Only quiz draft generation is tracked here. API charges are separate from AWS credits.','전체 기록 백업':'Download all records','보고서·질문·퀴즈 결과와 PDF를 ZIP으로 내려받습니다.':'Download reports, questions, quiz results, and PDFs as a ZIP file.','전체 기록 다운로드 ↓':'Download records ↓',
  '활동 기록':'Activity log','팀원이 언제 무엇을 바꿨는지 확인할 수 있어요. 가입코드와 작성 내용은 기록에 남기지 않습니다.':'See who changed what and when. Join codes and written content are never stored in this log.','사용자':'Member','전체':'All','더 보기':'More','아직 기록이 없습니다.':'No activity yet.','튜티 가입':'Student joined','가입코드 발급 완료':'Join code created','Zoom 링크 변경':'Zoom link changed','팀원 정보·권한 변경':'Member details or role changed','일정·진도 변경':'Schedule or progress changed','PDF 자료 등록':'PDF added','공지 게시':'Announcement posted','공지 삭제 완료':'Announcement deleted','질문 게시':'Question posted','질문 상태 변경':'Question status changed','답글 게시':'Reply posted','보고서 저장·제출':'Report saved or submitted','출석·메모 변경':'Attendance or notes changed','퀴즈 답안 제출':'Quiz submitted','Claude 퀴즈 초안 생성':'Claude quiz draft generated','HTML 퀴즈 가져오기 완료':'HTML quiz imported','퀴즈 수정·공개':'Quiz edited or published',
  '자료구조 기초 · 재귀 · 배열/포인터':'Data structure basics · recursion · arrays/pointers','리스트 · 연결 리스트':'Lists · linked lists','스택 · 큐 · 트리 기초':'Stacks · queues · tree basics','트리 · BST · 중간고사 대비':'Trees · BST · midterm review','우선순위 큐 · 힙':'Priority queues · heaps','정렬':'Sorting','그래프 · DFS/BFS':'Graphs · DFS/BFS','최소 신장 트리':'Minimum spanning trees','최단 경로 · 위상 정렬 · 해싱':'Shortest paths · topological sort · hashing','해싱 · 탐색 · 기말 대비':'Hashing · search · final review',
  '성능 분석, 재귀, 배열, 구조체, 동적 메모리':'Performance analysis, recursion, arrays, structures, dynamic memory','배열 리스트, 단일/이중 연결 리스트, 삽입과 삭제':'Array lists, singly/doubly linked lists, insertion and deletion','스택/큐 구현과 활용, 이진 트리':'Stack/queue implementation and applications, binary trees','트리 순회, BST 삽입/삭제, 시간 복잡도':'Tree traversal, BST insertion/deletion, time complexity','힙, heapify, 우선순위 큐의 복잡도':'Heaps, heapify, priority queue complexity','선택/삽입/버블/합병/퀵정렬, 안정성':'Selection/insertion/bubble/merge/quick sort and stability','인접행렬/리스트, 깊이/너비 우선 탐색':'Adjacency matrices/lists, depth/breadth-first search','Prim, Kruskal, 유니온파인드':'Prim, Kruskal, union-find','Dijkstra, DAG, 해시 함수와 충돌':'Dijkstra, DAGs, hash functions and collisions','오버플로, 이진/인덱스/트리 탐색, 자료구조 선택':'Overflow, binary/index/tree search, choosing data structures',
  '학관 또는 포스코관 · 비대면 병행 예정':'Student Center or Posco Hall · online sessions planned',
  '9월 17일 18:30 첫 미팅 안내':'First meeting · Sep 17 at 18:30',
  '9월 17일(목) 18:30에 Zoom으로 첫 미팅을 진행합니다. 서로 소개하고 튜터링 방식과 일정을 안내할게요. Zoom 링크는 「Zoom 모임」 탭에서 확인해 주세요.\n\n정규 튜터링은 화요일 11:00에 학관 또는 포스코관에서 진행하고, 비대면도 섞을 예정입니다. 자세한 내용은 첫 미팅에서 설명하겠습니다.':'Our first Zoom meeting is Thursday, Sep 17 at 18:30. We will introduce ourselves and go over the tutoring format and schedule. Find the link in the Zoom Meeting tab.\n\nRegular tutoring is planned for Tuesdays at 11:00 in the Student Center or Posco Hall, with some online sessions. We will explain the details at the first meeting.'
};

const textState=new WeakMap<Text,{original:string;rendered:string}>();
const attrState=new WeakMap<Element,Map<string,{original:string;rendered:string}>>();
function translateText(value:string,language:Language){
  const match=value.match(/^(\s*)([\s\S]*?)(\s*)$/);
  if(!match)return value;
  const [,before,body,after]=match;
  const dictionary=language==='ru'?ru:language==='kk'?kk:en;
  let translated=dictionary[body];
  if(!translated&&(language==='ru'||language==='kk')){
    const week=body.match(/^(\d+)주차(?: 학습 보고서| 참석 여부)?$/);
    if(week){
      const n=week[1];
      translated=body.endsWith('학습 보고서')?(language==='ru'?`Отчёт за неделю ${n}`:`${n}-аптаның оқу есебі`):body.endsWith('참석 여부')?(language==='ru'?`Участие в неделе ${n}`:`${n}-аптаға қатысу`):(language==='ru'?`Неделя ${n}`:`${n}-апта`);
    }
    const question=body.match(/^(\d+)번 문항$/);
    if(!translated&&question)translated=language==='ru'?`Вопрос ${question[1]}`:`${question[1]}-сұрақ`;
    const minutes=body.match(/^(\d+)분$/);
    if(!translated&&minutes)translated=language==='ru'?`${minutes[1]} мин`:`${minutes[1]} мин`;
    const page=body.match(/^(\d+)페이지까지$/);
    if(!translated&&page)translated=language==='ru'?`до стр. ${page[1]}`:`${page[1]}-бетке дейін`;
    if(!translated&&body.startsWith('핵심 개념:'))translated=body.replace('핵심 개념:',language==='ru'?'Ключевые понятия:':'Негізгі ұғымдар:');
  }
  if(!translated){
    let dynamic=body.match(/^(\d+)주차(?: 학습 보고서)?$/);
    if(dynamic)translated=body.endsWith('학습 보고서')?`Week ${dynamic[1]} learning report`:`Week ${dynamic[1]}`;
    dynamic=body.match(/^(\d+)주차 참석 여부$/);
    if(!translated&&dynamic)translated=`Week ${dynamic[1]} attendance`;
    dynamic=body.match(/^(\d+)번 문항$/);
    if(!translated&&dynamic)translated=`Question ${dynamic[1]}`;
    dynamic=body.match(/^(\d+)페이지까지$/);
    if(!translated&&dynamic)translated=`through page ${dynamic[1]}`;
    dynamic=body.match(/^(\d+)분$/);
    if(!translated&&dynamic)translated=`${dynamic[1]} min`;
    if(!translated&&body.startsWith('공개된 주차 '))translated=body.replace('공개된 주차','Published weeks').replace('일정과 주제는 튜터가 확인한 뒤 공개합니다.','The tutor reviews dates and topics before publishing.');
    if(!translated&&body.startsWith('현재 진도:'))translated=body.replace('현재 진도:','Current progress:').replace('페이지까지','pages reached');
    if(!translated&&body.startsWith('보고서 ')&&body.includes('진도 기록 전'))translated=body.replace('보고서 ','Report: ').replace('진도 기록 전','progress not recorded');
    if(!translated&&body.startsWith('화요일 11:00 ~ 11:50'))translated=body.replace('화요일 11:00 ~ 11:50 · 장소 추후 안내','Tuesday 11:00–11:50 · venue TBA');
    if(!translated&&body.startsWith('핵심 개념:'))translated=body.replace('핵심 개념:','Key concepts:');
  }
  if(!translated&&language!=='en')translated=en[body];
  return before+(translated||body)+after;
}
function applyText(node:Text,language:Language){
  const current=node.nodeValue||'',saved=textState.get(node);
  const original=saved&&current===saved.rendered?saved.original:current;
  const rendered=language==='ko'?original:translateText(original,language);
  textState.set(node,{original,rendered});
  if(current!==rendered)node.nodeValue=rendered;
}
function applyAttr(element:Element,key:string,language:Language){
  const current=element.getAttribute(key);if(current===null)return;
  const saved=attrState.get(element)||new Map(),prior=saved.get(key);
  const original=prior&&current===prior.rendered?prior.original:current;
  const rendered=language==='ko'?original:translateText(original,language);
  saved.set(key,{original,rendered});attrState.set(element,saved);
  if(current!==rendered)element.setAttribute(key,rendered);
}
export function installLanguage(language:Language){
  document.documentElement.lang=language;
  let running=false;
  const update=()=>{
    if(running)return;running=true;
    const walk=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    while(walk.nextNode())applyText(walk.currentNode as Text,language);
    for(const element of document.body.querySelectorAll('[placeholder],[title],[aria-label]'))for(const key of ['placeholder','title','aria-label'])applyAttr(element,key,language);
    running=false;
  };
  update();
  const observer=new MutationObserver(update);
  observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','title','aria-label']});
  return ()=>observer.disconnect();
}
