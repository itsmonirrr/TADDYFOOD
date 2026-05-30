import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://hdycacfdubbatginbmeo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkeWNhY2ZkdWJiYXRnaW5ibWVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNjc2NzUsImV4cCI6MjA5NTY0MzY3NX0.UNZ3mE0qp7_-0xYcNnBb822XdECSRNE3Z5rtmcPBxaM'
)
