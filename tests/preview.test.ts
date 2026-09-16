import test from 'node:test';
import assert from 'node:assert/strict';
import { seedWeeks, type Quiz } from '../shared/domain.js';
import { studentPreview } from '../web/src/preview.js';
import type { State } from '../web/src/state.js';

test('student preview hides unpublished weeks, answers, other replies, and tutor records',()=>{
  const quiz:Quiz={weekId:1,title:'quiz',concepts:'',status:'published',source:'manual',updatedAt:'',items:Array.from({length:5},(_,i)=>({id:String(i),question:'Question',choices:['A','B','C','D'],answer:1,explanation:'Secret answer'}))};
  const state:State={
    me:{id:'tutor',name:'Tutor',email:'tutor@example.com',role:'tutor',active:true,createdAt:''},
    members:[{id:'tutor',name:'Tutor',email:'tutor@example.com',role:'tutor',active:true,createdAt:''},{id:'student',name:'Student',email:'student@example.com',role:'student',active:true,createdAt:''},{id:'other',name:'Other',email:'other@example.com',role:'student',active:true,createdAt:''}],
    weeks:[{...seedWeeks[0],published:true},seedWeeks[1]],notices:[],
    materials:[{id:'public',weekId:1,name:'public.pdf',key:'one',size:1,createdAt:''},{id:'private',weekId:2,name:'private.pdf',key:'two',size:1,createdAt:''}],
    questions:[],reports:[{weekId:1,authorId:'other',content:'Private draft',status:'draft',updatedAt:''}],
    quizzes:[quiz],attempts:[],rsvps:[{weekId:1,memberId:'student',status:'no',reason:'My reason',updatedAt:''},{weekId:1,memberId:'other',status:'no',reason:'Other private reason',updatedAt:''}],
    config:{zoomUrl:''},tutorWeeks:[{weekId:1,attendance:{student:false},notes:'Tutor note'}],activityLog:[{at:'',actorEmail:'',action:'',target:''}]
  };
  const preview=studentPreview(state,'student');
  assert.ok(preview);
  assert.deepEqual(preview.weeks.map(w=>w.id),[1]);
  assert.deepEqual(preview.materials.map(m=>m.id),['public']);
  assert.equal(preview.reports.length,0);
  assert.equal(preview.rsvps.length,1);
  assert.equal(preview.rsvps[0].reason,'My reason');
  assert.equal('email' in preview.members[0],false);
  assert.equal(preview.tutorWeeks,undefined);
  assert.equal(preview.activityLog,undefined);
  assert.equal('answer' in preview.quizzes[0].items[0],false);
  assert.equal('explanation' in preview.quizzes[0].items[0],false);
});
