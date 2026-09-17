import test from 'node:test';
import assert from 'node:assert/strict';
import { isPdfHeader, noticePdfKey, validPdfUpload } from '../api/notice-attachment.js';

const id='1aa9df0e-63c2-4a6b-b944-d20ec2a8a603';

test('notice PDF paths are isolated by classroom and reject arbitrary keys',()=>{
  assert.equal(noticePdfKey('default',id),`notice-attachments/${id}.pdf`);
  assert.equal(noticePdfKey('class-a',id),`workspaces/class-a/notice-attachments/${id}.pdf`);
  assert.notEqual(noticePdfKey('class-a',id),noticePdfKey('class-b',id));
  assert.throws(()=>noticePdfKey('default','../../private.pdf'));
});

test('notice attachments accept a real PDF within the upload limit',()=>{
  assert.equal(validPdfUpload('계획서.PDF',762688),true);
  assert.equal(validPdfUpload('계획서.txt',762688),false);
  assert.equal(validPdfUpload('계획서.pdf',10_000_001),false);
  assert.equal(isPdfHeader(Buffer.from('%PDF-')),true);
  assert.equal(isPdfHeader(Buffer.from('<html>')),false);
});
