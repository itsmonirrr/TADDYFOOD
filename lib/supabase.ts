import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hdycacfdubbatginbmeo.supabase.co';
const supabaseKey = 'sb_publishable_bv4OvOVQLB3nHAPwquQIcA_NB-VWxQ_';

export const supabase = createClient(supabaseUrl, supabaseKey);
