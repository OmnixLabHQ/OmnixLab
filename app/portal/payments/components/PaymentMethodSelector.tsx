'use client'

interface PaymentMethodSelectorProps {
  selectedMethod: string
  onSelect: (method: string) => void
  disabled?: boolean
}

const PAYMENT_METHODS = [
  { id: 'paystack', label: 'Pay Online (Paystack)', icon: '[CARD]', description: 'Secure card or bank payment', type: 'automated' },
  { id: 'bank_transfer', label: 'Bank Transfer', icon: '[BANK]', description: 'Direct bank transfer', type: 'manual' },
  { id: 'wire_transfer', label: 'Wire Transfer', icon: '[WIRE]', description: 'International wire transfer', type: 'manual' },
  { id: 'fedwire', label: 'FedWire', icon: '[FED]', description: 'US domestic wire', type: 'manual' },
  { id: 'local_wire', label: 'Local Wire Transfer', icon: '[LOCAL]', description: 'Local wire transfer', type: 'manual' },
  { id: 'remitly', label: 'Remitly', icon: '[REM]', description: 'Send via Remitly', type: 'manual' },
  { id: 'worldremit', label: 'WorldRemit', icon: '[WORLD]', description: 'Send via WorldRemit', type: 'manual' },
  { id: 'western_union', label: 'Western Union', icon: '[WU]', description: 'Send via Western Union', type: 'manual' },
  { id: 'moneygram', label: 'MoneyGram', icon: '[MG]', description: 'Send via MoneyGram', type: 'manual' },
  { id: 'usdt', label: 'USDT (Crypto)', icon: '[USDT]', description: 'Pay with USDT', type: 'manual' },
]

export default function PaymentMethodSelector({ selectedMethod, onSelect, disabled = false }: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-2">
      {PAYMENT_METHODS.map((method) => (
        <button
          key={method.id}
          onClick={() => onSelect(method.id)}
          disabled={disabled}
          className={`w-full text-left p-4 rounded-xl border transition-colors ${
            selectedMethod === method.id
              ? 'bg-blue-500/20 border-blue-500'
              : 'bg-white/5 border-white/10 hover:bg-white/10'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">{method.icon}</span>
              <div>
                <span className="text-white font-medium">{method.label}</span>
                <p className="text-xs text-gray-400">{method.description}</p>
              </div>
            </div>
            {method.type === 'automated' && (
              <span className="px-2 py-0.5 bg-green-500/20 text-green-300 text-xs rounded-full shrink-0">
                Instant
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}