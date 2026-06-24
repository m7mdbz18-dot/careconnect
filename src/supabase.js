import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rknvwwthnxityxfwfzyv.supabase.co'
const supabaseKey = 'sb_publishable_I6WjvLBSZksxrdxMJbrXLg_prx33sR6'

export const supabase = createClient(supabaseUrl, supabaseKey)