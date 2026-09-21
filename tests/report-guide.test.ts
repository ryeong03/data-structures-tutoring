import test from 'node:test';
import assert from 'node:assert/strict';
import { reportGuideKey } from '../api/report-guide.js';

test('report PDF paths stay inside their classroom and accept only known guide kinds',()=>{
  const id='12345678-1234-1234-1234-123456789abc';
  assert.equal(reportGuideKey('default','template',id),`report-guides/template/${id}.pdf`);
  assert.equal(reportGuideKey('class-123','in-person',id),`workspaces/class-123/report-guides/in-person/${id}.pdf`);
  assert.throws(()=>reportGuideKey('class-123','../materials/private',id));
  assert.throws(()=>reportGuideKey('class-123','template','../private'));
});
