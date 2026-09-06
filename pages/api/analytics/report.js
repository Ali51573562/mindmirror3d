import { analyticsDatabase, authorizeAnalytics } from '../../../lib/analyticsServer';
import { summarizeAnalytics } from '../../../lib/analyticsSummary';
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET')return res.status(405).end();
  try{
    if(!await authorizeAnalytics(req))return res.status(403).json({error:'Administrator access required'});
    const days=Math.max(1,Math.min(90,Number(req.query.days)||7));const internal=req.query.internal==='true';
    const since=new Date(Date.now()-days*86400000).toISOString();const db=analyticsDatabase();let rows=[],offset=0,truncated=false;
    while(offset<50000){
      const {data,error}=await db.from('funnel_events').select('id,event_name,created_at,context').gte('created_at',since).not('context','is',null).order('created_at',{ascending:true}).order('id',{ascending:true}).range(offset,offset+999);
      if(error)return res.status(503).json({error:'Analytics database update is required or data is unavailable.'});
      rows.push(...data);if(data.length<1000)break;offset+=1000;if(offset===50000)truncated=true;
    }
    const excluded=rows.filter(e=>e.context?.internal).length;
    if(!internal)rows=rows.filter(e=>!e.context?.internal);
    return res.json({...summarizeAnalytics(rows),days,excludedTestEvents:excluded,truncated});
  }catch{return res.status(503).json({error:'Analytics service unavailable'});}
}
