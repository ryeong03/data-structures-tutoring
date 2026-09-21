import { DEFAULT_WORKSPACE } from './store.js';

export const reportGuideKinds = ['template', 'in-person', 'online'] as const;
export type ReportGuideKind = typeof reportGuideKinds[number];

export function reportGuideKey(workspace: string, kind: string, id: string): string {
  if (!reportGuideKinds.includes(kind as ReportGuideKind)) throw new Error('보고서 자료 종류를 확인해 주세요.');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new Error('보고서 자료 식별자를 확인해 주세요.');
  return workspace === DEFAULT_WORKSPACE
    ? `report-guides/${kind}/${id}.pdf`
    : `workspaces/${workspace}/report-guides/${kind}/${id}.pdf`;
}
