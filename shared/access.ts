import type { Member, Week, Question } from './domain.js';

export const canViewWeek=(member:Member,week:Week)=>member.role==='tutor'||week.published;
export const canEditProgress=(member:Member,week:Week)=>member.role==='tutor'||member.role==='rep'&&week.published;
export const canWriteReport=(member:Member,week:Week)=>week.published&&week.reportMemberId===member.id;
export const canResolveQuestion=(member:Member,question:Question)=>member.role==='tutor'||question.authorId===member.id;
export const canRsvp=(member:Member,week:Week)=>member.role!=='tutor'&&week.published;
