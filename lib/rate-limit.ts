import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tmvsxsbiowhcufbyqfan.supabase.co'
const supabaseSecretKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey)

export async function checkRateLimit(
  email: string,
  ipAddress: string,
  maxAttempts: number = 5,
  windowMinutes: number = 15
): Promise<{ allowed: boolean; attempts: number; retryAfter?: number }> {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString()

  const { data: attempts, error } = await supabaseAdmin
    .from('login_attempts')
    .select('*')
    .eq('email', email)
    .gte('created_at', windowStart)
    .eq('success', false)

  if (error) {
    console.error('Rate limit check error:', error)
    return { allowed: true, attempts: 0 }
  }

  const failedAttempts = attempts?.length || 0

  if (failedAttempts >= maxAttempts) {
    const oldestAttempt = attempts?.[0]
    const retryAfter = oldestAttempt
      ? Math.ceil((new Date(oldestAttempt.created_at).getTime() + windowMinutes * 60 * 1000 - Date.now()) / 1000)
      : 60
    return { allowed: false, attempts: failedAttempts, retryAfter }
  }

  return { allowed: true, attempts: failedAttempts }
}

export async function logLoginAttempt(
  email: string,
  ipAddress: string,
  userAgent: string,
  success: boolean
) {
  await supabaseAdmin.from('login_attempts').insert({
    email,
    ip_address: ipAddress,
    user_agent: userAgent,
    success,
  })
}

export async function logSecurityEvent(
  userId: string,
  eventType: string,
  metadata: Record<string, any> = {},
  ipAddress?: string,
  userAgent?: string
) {
  await supabaseAdmin.from('security_events').insert({
    user_id: userId,
    event_type: eventType,
    metadata,
    ip_address: ipAddress,
    user_agent: userAgent,
  })
}