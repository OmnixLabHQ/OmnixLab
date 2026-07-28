import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tmvsxsbiowhcufbyqfan.supabase.co'
const supabaseKey = 'sb_publishable_jXu7YbDrz26BbNxg7N33FA_vATtHG2U'

export const supabase = createClient(supabaseUrl, supabaseKey)