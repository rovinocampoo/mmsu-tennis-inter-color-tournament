export const TOURNAMENT_START = "2026-11-11";
export const TOURNAMENT_END = "2026-12-08";
export const TIME_ZONE = "Asia/Manila";
export const TEAMS = { blue:{name:"Team Blue",leader:"Chloe Castro",color:"#3478df"}, white:{name:"Team White",leader:"Kathleen Flojo",color:"#f5f5ed"} } as const;
export type TeamKey = keyof typeof TEAMS;
export type MatchScore = {blue:number;white:number};
export function validateAdvantageSet({blue,white}:MatchScore):{valid:boolean;winner:TeamKey|null;message:string}{
 if(!Number.isInteger(blue)||!Number.isInteger(white)||blue<0||white<0)return {valid:false,winner:null,message:"Enter whole-number game scores."};
 if(blue===white)return {valid:false,winner:null,message:"A completed set cannot be tied."};
 const high=Math.max(blue,white),low=Math.min(blue,white);
 if(high===8&&low===7)return {valid:true,winner:blue>white?"blue":"white",message:"Valid 7–7 tiebreak result."};
 if(high<8||high-low<2)return {valid:false,winner:null,message:"A team must reach at least 8 games and lead by 2, except 8–7 which is decided by a tiebreak."};
 return {valid:true,winner:blue>white?"blue":"white",message:"Valid 8-game advantage-set result."};
}
export type CompletedScore = {status:string;blue:number;white:number};
export function aggregateDailyScores(matches:CompletedScore[]){return matches.filter(m=>m.status==="completed").reduce((a,m)=>({blue:a.blue+m.blue,white:a.white+m.white,matches:a.matches+1}),{blue:0,white:0,matches:0});}
export function getManilaDate(date=new Date()){return new Intl.DateTimeFormat("en-CA",{timeZone:TIME_ZONE,year:"numeric",month:"2-digit",day:"2-digit"}).format(date)}
export function getTomorrowManilaDate(date=new Date()){const parts=new Intl.DateTimeFormat("en-US",{timeZone:TIME_ZONE,year:"numeric",month:"numeric",day:"numeric"}).formatToParts(date);const y=Number(parts.find(p=>p.type==="year")?.value),m=Number(parts.find(p=>p.type==="month")?.value),d=Number(parts.find(p=>p.type==="day")?.value);return new Date(Date.UTC(y,m-1,d+1)).toISOString().slice(0,10)}
