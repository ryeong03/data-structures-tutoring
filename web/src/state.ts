import type { Member, PublicMember, Week, Notice, Material, Question, Report, Quiz, Attempt, TutorWeek, Rsvp } from '../../shared/domain.js';

export type Activity={at:string;actorEmail:string;action:string;target:string;notification?:'sent'|'failed'|'unconfigured'|'none'};
export type State={me:(Member|PublicMember)&{email?:string};members:(Member|PublicMember)[];weeks:Week[];notices:Notice[];materials:Material[];questions:Question[];reports:Report[];quizzes:Quiz[];attempts:Attempt[];rsvps:Rsvp[];config:{zoomUrl:string};tutorWeeks?:TutorWeek[];aiUsage?:{at:string;weekId:number;model:string;usage:{input_tokens?:number;output_tokens?:number}}[];activityLog?:Activity[];inviteActive?:boolean};
