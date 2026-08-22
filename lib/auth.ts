import { createClient } from '@supabase/supabase-js'
import { createHash, randomBytes } from 'crypto'

const supabaseUrl = 'https://tmvsxsbiowhcufbyqfan.supabase.co'
const supabaseSecretKey = 'YOUR_ENV_VARIABLE_HERE'
const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey)

// ============================================
// DEVICE & SESSION MANAGEMENT
// ============================================

export async function trackDeviceSession(
  userId: string,
  userAgent: string,
  ipAddress: string,
  isCurrent: boolean = false
) {
  const deviceInfo = parseUserAgent(userAgent)

  await supabaseAdmin.from('device_sessions').insert({
    user_id: userId,
    device_name: deviceInfo.device,
    browser: deviceInfo.browser,
    os: deviceInfo.os,
    ip_address: ipAddress,
    location: 'Unknown', // Could use IP geolocation service
    is_current: isCurrent,
  })
}

export async function getActiveSessions(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('device_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('last_active_at', { ascending: false })

  return data || []
}

export async function revokeSession(sessionId: string, userId: string) {
  await supabaseAdmin
    .from('device_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('user_id', userId)
}

export async function revokeAllOtherSessions(userId: string, currentSessionId: string) {
  await supabaseAdmin
    .from('device_sessions')
    .delete()
    .eq('user_id', userId)
    .neq('id', currentSessionId)
}

function parseUserAgent(userAgent: string): { device: string; browser: string; os: string } {
  let device = 'Unknown Device'
  let browser = 'Unknown Browser'
  let os = 'Unknown OS'

  if (userAgent.includes('iPhone')) device = 'iPhone'
  else if (userAgent.includes('iPad')) device = 'iPad'
  else if (userAgent.includes('Android')) device = 'Android Device'
  else if (userAgent.includes('Windows')) device = 'Windows PC'
  else if (userAgent.includes('Macintosh')) device = 'Mac'

  if (userAgent.includes('Firefox')) browser = 'Firefox'
  else if (userAgent.includes('Chrome')) browser = 'Chrome'
  else if (userAgent.includes('Safari')) browser = 'Safari'
  else if (userAgent.includes('Edge')) browser = 'Edge'

  if (userAgent.includes('Windows')) os = 'Windows'
  else if (userAgent.includes('Macintosh')) os = 'macOS'
  else if (userAgent.includes('Linux')) os = 'Linux'
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS'
  else if (userAgent.includes('Android')) os = 'Android'

  return { device, browser, os }
}

// ============================================
// RECOVERY CODES
// ============================================

export function generateRecoveryCodes(count: number = 10): string[] {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    const code = randomBytes(6).toString('hex').toUpperCase().match(/.{1,4}/g)?.join('-') || ''
    codes.push(code)
  }
  return codes
}

export function hashRecoveryCode(code: string): string {
  return createHash('sha256').update(code).digest('hex')
}

export async function storeRecoveryCodes(userId: string, codes: string[]) {
  // Delete old unused codes
  await supabaseAdmin
    .from('recovery_codes')
    .delete()
    .eq('user_id', userId)
    .eq('is_used', false)

  for (const code of codes) {
    await supabaseAdmin.from('recovery_codes').insert({
      user_id: userId,
      code_hash: hashRecoveryCode(code),
    })
  }
}

export async function verifyRecoveryCode(userId: string, code: string): Promise<boolean> {
  const codeHash = hashRecoveryCode(code)

  const { data } = await supabaseAdmin
    .from('recovery_codes')
    .select('*')
    .eq('user_id', userId)
    .eq('code_hash', codeHash)
    .eq('is_used', false)
    .single()

  if (!data) return false

  await supabaseAdmin
    .from('recovery_codes')
    .update({ is_used: true, used_at: new Date().toISOString() })
    .eq('id', data.id)

  return true
}

// ============================================
// ACCOUNT STATUS
// ============================================

export async function getAccountStatus(userId: string): Promise<string> {
  const { data } = await supabaseAdmin
    .from('account_status')
    .select('status')
    .eq('user_id', userId)
    .single()

  return data?.status || 'active'
}

export async function suspendAccount(userId: string, reason: string, adminId: string) {
  await supabaseAdmin
    .from('account_status')
    .upsert({
      user_id: userId,
      status: 'suspended',
      reason,
      suspended_by: adminId,
      suspended_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

  // Log audit
  await supabaseAdmin.from('audit_logs').insert({
    user_id: userId,
    action: 'ACCOUNT_SUSPENDED',
    entity_type: 'account',
    entity_id: userId,
    after_data: { reason },
  })
}

export async function reactivateAccount(userId: string) {
  await supabaseAdmin
    .from('account_status')
    .upsert({
      user_id: userId,
      status: 'active',
      reason: null,
      reactivated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

  await supabaseAdmin.from('audit_logs').insert({
    user_id: userId,
    action: 'ACCOUNT_REACTIVATED',
    entity_type: 'account',
    entity_id: userId,
  })
}

// ============================================
// AUDIT LOGGING
// ============================================

export async function logAuditEvent(
  userId: string,
  action: string,
  entityType?: string,
  entityId?: string,
  beforeData?: Record<string, any>,
  afterData?: Record<string, any>
) {
  await supabaseAdmin.from('audit_logs').insert({
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    before_data: beforeData || null,
    after_data: afterData || null,
  })
}

export async function getAuditLogs(userId: string, limit: number = 50) {
  const { data } = await supabaseAdmin
    .from('audit_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  return data || []
}

// ============================================
// TRUSTED DEVICES
// ============================================

export async function addTrustedDevice(
  userId: string,
  deviceName: string,
  browser: string,
  os: string
) {
  const token = randomBytes(32).toString('hex')
  const tokenHash = createHash('sha256').update(token).digest('hex')

  await supabaseAdmin.from('trusted_devices').insert({
    user_id: userId,
    device_name: deviceName,
    browser,
    os,
    token_hash: tokenHash,
  })
}

export async function getTrustedDevices(userId: string) {
  const { data } = await supabaseAdmin
    .from('trusted_devices')
    .select('*')
    .eq('user_id', userId)
    .eq('is_trusted', true)

  return data || []
}

export async function removeTrustedDevice(deviceId: string, userId: string) {
  await supabaseAdmin
    .from('trusted_devices')
    .delete()
    .eq('id', deviceId)
    .eq('user_id', userId)
}

// ============================================
// PASSWORD STRENGTH
// ============================================

export function getPasswordStrength(password: string): {
  score: number
  label: string
  color: string
} {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 2) return { score, label: 'Weak', color: 'red' }
  if (score <= 4) return { score, label: 'Fair', color: 'amber' }
  return { score, label: 'Strong', color: 'green' }
}

// ============================================
// SENSITIVE ACTION RE-AUTHENTICATION
// ============================================

export async function verifyPasswordForSensitiveAction(
  email: string,
  password: string
): Promise<boolean> {
  const supabaseClient = createClient(supabaseUrl, 'sb_publishable_LOlCQ7ZoADyq-s0Dv9sxGA_l1xQoHTG')
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password })
  return !error
}