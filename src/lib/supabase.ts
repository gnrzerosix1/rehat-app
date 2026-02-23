import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xyojubkqchmupqdwiwja.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5b2p1YmtxY2htdXBxZHdpd2phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NDAyNTksImV4cCI6MjA4NzMxNjI1OX0.5gyEoR8rs1cmLQFSJZxV4wbsQC8YT_bd4Ux1UJQLnmw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
