import { DEFAULT_WORKSPACE } from './store.js';

export const reportGuideKinds = ['template', 'in-person', 'online'] as const;
export type ReportGuideKind = typeof reportGuideKinds[number];

export const reportGuideExts = ['pdf', 'docx'] as const;
export type ReportGuideExt = typeof reportGuideExts[number];
export const REPORT_GUIDE_LIMIT = 10_000_000;
const types: Record<ReportGuideExt, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
};

export function guideExt(name: string): ReportGuideExt | '' {
  const lower = name.toLowerCase();
  return lower.endsWith('.docx') ? 'docx' : lower.endsWith('.pdf') ? 'pdf' : '';
}

export const guideContentType = (ext: ReportGuideExt) => types[ext];

export function validGuideUpload(name: string, size: number): boolean {
  return !!guideExt(name) && Number.isInteger(size) && size > 0 && size <= REPORT_GUIDE_LIMIT;
}

/** docx는 zip 컨테이너라 PK로 시작합니다. */
export function validGuideHeader(ext: ReportGuideExt, bytes: Uint8Array | undefined): boolean {
  if (!bytes) return false;
  const head = Buffer.from(bytes).toString('ascii');
  return ext === 'docx' ? head.startsWith('PK') : head.startsWith('%PDF-');
}

export function reportGuideKey(workspace: string, kind: string, id: string, ext: ReportGuideExt = 'pdf'): string {
  if (!reportGuideKinds.includes(kind as ReportGuideKind)) throw new Error('보고서 자료 종류를 확인해 주세요.');
  if (!reportGuideExts.includes(ext)) throw new Error('보고서 자료 형식을 확인해 주세요.');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new Error('보고서 자료 식별자를 확인해 주세요.');
  return workspace === DEFAULT_WORKSPACE
    ? `report-guides/${kind}/${id}.${ext}`
    : `workspaces/${workspace}/report-guides/${kind}/${id}.${ext}`;
}
