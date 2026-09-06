import { analyticsDatabase } from '../../../lib/analyticsServer';
import { cleanEvent } from '../../../lib/analyticsValidation';
export const config={api:{bodyParser:{sizeLimit:'48kb'}}};
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST')return res.status(405).end();
  // Browser writes must originate from this site. No cross-origin analytics endpoint.
  if(req.headers.origin){try{if(new URL(req.headers.origin).host!==req.headers.host)return res.status(403).end();}catch{return res.status(403).end();}}
  let events;
  try{if(!Array.isArray(req.body?.events)||req.body.events.length<1||req.body.events.length>20)throw Error();events=req.body.events.map(cleanEvent);}catch{return res.status(400).json({error:'Invalid analytics payload'});}
  try{
    const db=analyticsDatabase();
    const {error}=await db.from('funnel_events').upsert(events,{onConflict:'id'});
    if(error){
      // Before the additive migration, retain basic tracking but leave details queued.
      if(error.code==='PGRST204'||error.code==='42703'){
        const basic=events.map(({context,...event})=>event);
        await db.from('funnel_events').upsert(basic,{onConflict:'id',ignoreDuplicates:true});
        return res.status(503).json({error:'Analytics database update required'});
      }
      return res.status(503).json({error:'Analytics storage temporarily unavailable'});
    }
    return res.status(200).json({stored:events.length});
  }catch{return res.status(503).json({error:'Analytics storage unavailable'});}
}
