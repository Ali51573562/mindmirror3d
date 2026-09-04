import { supabase } from './supabaseClient';

function getSessionId() {
  let id = localStorage.getItem('mm_session_id');

  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('mm_session_id', id);
  }

  return id;
}

export async function trackFunnelEvent(eventName, pagePath, userId = null) {
  try {
    const sessionId = getSessionId();

    await supabase.from('funnel_events').insert({
      session_id: sessionId,
      user_id: userId,
      event_name: eventName,
      page_path: pagePath,
    });
  } catch (err) {
    console.error('Funnel tracking error:', err);
  }
}