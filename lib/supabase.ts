import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://fqeyrtjlfnsxgwczcrvx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxZXlydGpsZm5zeGd3Y3pjcnZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxMDYxMDAsImV4cCI6MjEwMTY4MjEwMH0.ylDt8pkzovy8ARlzQaAk22N7jKzD61xYXB3F-iQ_nTc'
)