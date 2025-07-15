import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cghmehqpyvjeghukblxm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnaG1laHFweXZqZWdodWtibHhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzg5ODksImV4cCI6MjA2NjcxNDk4OX0.qsLzxIv9HKVA0W80orSSYwbri2bEm-XQwMcIO06sxWE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
