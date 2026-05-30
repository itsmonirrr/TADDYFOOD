import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  'https://hdycacfdubbatginbmeo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkeWNhY2ZkdWJiYXRnaW5ibWVvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDA2NzY3NSwiZXhwIjoyMDk1NjQzNjc1fQ.npWbq8J1Pop00rX-tnvQsSW719A4lRe1dI1a7vMZabQ'
)
