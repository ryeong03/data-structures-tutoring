import { DEFAULT_WORKSPACE } from './store.js';

export const NOTICE_PDF_LIMIT = 10_000_000;

export function noticePdfKey(workspace: string, id: string): string {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new Error('첨부파일 식별자를 확인해 주세요.');
  return workspace === DEFAULT_WORKSPACE ? `notice-attachments/${id}.pdf` : `workspaces/${workspace}/notice-attachments/${id}.pdf`;
}

export function validPdfUpload(name: string, size: number): boolean {
  return name.toLowerCase().endsWith('.pdf') && Number.isInteger(size) && size > 0 && size <= NOTICE_PDF_LIMIT;
}

export function isPdfHeader(bytes: Uint8Array | undefined): boolean {
  return !!bytes && Buffer.from(bytes).toString('ascii') === '%PDF-';
}
