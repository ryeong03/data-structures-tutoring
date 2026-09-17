import test from 'node:test';
import assert from 'node:assert/strict';
import { physicalKey, rowsForWorkspace, withWorkspace, workspaceId, type Item } from '../api/store.js';

test('legacy classroom keys remain unchanged and new classrooms use separate keys',async()=>{
  assert.equal(physicalKey('WEEK#1'),'WEEK#1');
  await withWorkspace('class-a',async()=>{
    assert.equal(workspaceId(),'class-a');
    assert.equal(physicalKey('WEEK#1'),'WS#class-a#WEEK#1');
  });
  assert.equal(workspaceId(),'default');
  const rows:Item[]=[
    {pk:'WEEK#1',sk:'META',data:{topic:'original'}},
    {pk:'WS#class-a#WEEK#1',sk:'META',data:{topic:'A'}},
    {pk:'WS#class-b#WEEK#1',sk:'META',data:{topic:'B'}},
    {pk:'WORKSPACE#class-a',sk:'META',data:{}},
    {pk:'ACCOUNT#student@example.com',sk:'WS#class-a',data:{}}
  ];
  assert.deepEqual(rowsForWorkspace(rows,'default').map(row=>row.data.topic),['original']);
  assert.deepEqual(rowsForWorkspace(rows,'class-a').map(row=>row.data.topic),['A']);
  assert.deepEqual(rowsForWorkspace(rows,'class-b').map(row=>row.data.topic),['B']);
  assert.equal(rowsForWorkspace(rows,'class-a')[0].pk,'WEEK#1');
});

test('concurrent requests keep their classroom context',async()=>{
  const results=await Promise.all(['class-a','class-b'].map(id=>withWorkspace(id,async()=>{
    await new Promise(resolve=>setTimeout(resolve,id==='class-a'?10:1));
    return physicalKey('MATERIAL#x');
  })));
  assert.deepEqual(results,['WS#class-a#MATERIAL#x','WS#class-b#MATERIAL#x']);
});
