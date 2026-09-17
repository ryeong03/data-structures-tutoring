export const normalizeInviteCode=(value:string)=>value.replace(/[\s-]/g,'').toUpperCase();
export const isTutorInviteCode=(value:string)=>/^T[A-F0-9]{24}$/.test(normalizeInviteCode(value));
export const formatTutorInviteCode=(hex:string)=>{
  if(!/^[A-F0-9]{24}$/.test(hex))throw new Error('Invalid tutor invite');
  return `T-${hex.match(/.{4}/g)!.join('-')}`;
};
