import { createClient } from '@supabase/supabase-js';

// TODO: Replace with your actual Supabase project URL and anon key
const SUPABASE_URL = 'https://rjoxbellgzvkyykegbbd.supabase.co';
const SUPABASE_ANON_KEY = 'sbp_0a22ba0c71f33aa9584800b77c49c7e7bbee428a';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
