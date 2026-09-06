import { createClient } from '@supabase/supabase-js';
export function analyticsDatabase() {
  if(!process.env.SUPABASE_SERVICE_ROLE_KEY)throw new Error('Database credentials unavailable');
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
}
export async function authorizeAnalytics(req) {
  const token=req.headers.authorization?.replace(/^Bearer /,'');if(!token)return false;
  const db=analyticsDatabase();const {data,error}=await db.auth.getUser(token);
  const admin=process.env.ANALYTICS_ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  return !error && !!admin && data.user?.email?.toLowerCase()===admin.toLowerCase();
}
