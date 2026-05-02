import { createClient } from '@supabase/supabase-js';

// Hardcoded for demo – replace with your real values (they're already in .env, but we're bypassing)
const supabaseUrl = 'https://tfoumplhevzardcpkyru.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmb3VtcGxoZXZ6YXJkY3BreXJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2ODMyNjgsImV4cCI6MjA5MzI1OTI2OH0.uIn4x11AfkOB2vnELvxT3PtfCxkvxDao1SsdWAATQC4';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {};
  if (session?.access_token) headers.Authorization = 'Bearer ' + session.access_token;
  return headers;
}

export default supabase;