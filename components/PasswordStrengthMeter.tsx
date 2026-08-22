'use client'

interface PasswordStrengthMeterProps {
  password: string
}

export default function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  function getStrength(): { score: number; label: string; color: string; width: string } {
    let score = 0
    if (password.length >= 8) score++
    if (password.length >= 12) score++
    if (/[A-Z]/.test(password)) score++
    if (/[a-z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++

    if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500', width: '33%' }
    if (score <= 4) return { score, label: 'Fair', color: 'bg-amber-500', width: '66%' }
    return { score, label: 'Strong', color: 'bg-green-500', width: '100%' }
  }

  if (!password) return null

  const strength = getStrength()

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500">Password strength:</span>
        <span className={`text-xs font-medium ${
          strength.label === 'Weak' ? 'text-red-600' :
          strength.label === 'Fair' ? 'text-amber-600' : 'text-green-600'
        }`}>
          {strength.label}
        </span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${strength.color} rounded-full transition-all duration-300`}
          style={{ width: strength.width }}
        />
      </div>
      <ul className="mt-2 space-y-1 text-xs text-gray-500">
        <li className={password.length >= 8 ? 'text-green-600' : ''}>✓ 8+ characters</li>
        <li className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>✓ Uppercase letter</li>
        <li className={/[a-z]/.test(password) ? 'text-green-600' : ''}>✓ Lowercase letter</li>
        <li className={/[0-9]/.test(password) ? 'text-green-600' : ''}>✓ Number</li>
        <li className={/[^A-Za-z0-9]/.test(password) ? 'text-green-600' : ''}>✓ Special character</li>
      </ul>
    </div>
  )
}