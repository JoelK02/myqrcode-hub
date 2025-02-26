
import { createClient } from '@supabase/supabase-js';

// Replace with your actual Supabase project URL and anon key
// For now, we're using placeholders
const supabaseUrl = 'https://your-project-url.supabase.co';
const supabaseAnonKey = 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
