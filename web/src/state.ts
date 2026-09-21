import type { Member, PublicMember, Week, Notice, Material, ReportGuide, Question, Report, Quiz, Attempt, TutorWeek, Rsvp } from '../../shared/domain.js';

export type Workspace={id:string;name:string;tutorEmail?:string;tutorName:string;createdAt?:string;active:boolean;studentCount?:number;materialCount?:number;publishedWeeks?:number};
export type Activity={at:string;actorEmail:string;action:string;target:string;notification?:'sent'|'failed'|'unconfigured'|'none'};
export type State={workspace?:Workspace;workspaces?:Workspace[];isAdmin?:boolean;me:(Member|PublicMember)&{email?:string};members:(Member|PublicMember)[];weeks:Week[];notices:Notice[];materials:Material[];reportGuides:ReportGuide[];questions:Question[];reports:Report[];quizzes:Quiz[];attempts:Attempt[];rsvps:Rsvp[];config:{zoomUrl:string};tutorWeeks?:TutorWeek[];aiUsage?:{at:string;weekId:number;model:string;usage:{input_tokens?:number;output_tokens?:number}}[];activityLog?:Activity[];inviteActive?:boolean};
