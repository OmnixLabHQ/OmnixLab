'use client'

import { useState } from 'react'

interface USDTWallet {
  network: string
  wallet_address: string
  memo_tag: string
  qr_code_url: string
}

const QR_CODE_BASE_URL = 'https://fqeyrtjlfnsxgwczcrvx.supabase.co/storage/v1/object/public/payment-qr-codes'

const USDT_WALLETS: USDTWallet[] = [
  {
    network: 'ERC20 (Ethereum)',
    wallet_address: '0x05cc5992a2ac3380a8c4eac0563323191b3e7b04',
    memo_tag: '',
    qr_code_url: `${QR_CODE_BASE_URL}/usdt-erc20.jpg`,
  },
  {
    network: 'TRC20 (TRON)',
    wallet_address: 'TDsAEYnpqtzh6Mj19ASY5nV2THKF3xYnDn',
    memo_tag: '',
    qr_code_url: `${QR_CODE_BASE_URL}/usdt-trc20.jpg`,
  },
  {
    network: 'BEP20 (BSC)',
    wallet_address: '0x05cc5992a2ac3380a8c4eac0563323191b3e7b04',
    memo_tag: '',
    qr_code_url: `${QR_CODE_BASE_URL}/usdt-bep20.jpg`,
  },
]

const C = {
  surface: '#0D1117',
  border: '#1E293B',
  text: '#F8FAFC',
  text2: '#94A3B8',
  blue: '#38BDF8',
  red: '#EF4444',
}

export default function USDTPaymentInstructions() {
  const [selectedNetwork, setSelectedNetwork] = useState(USDT_WALLETS[0].network)
  const [copied, setCopied] = useState('')

  const selectedWallet = USDT_WALLETS.find((w) => w.network === selectedNetwork)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(''), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Network Selector */}
      <div>
        <p style={{ fontSize: '13px', color: C.text2, margin: '0 0 8px 0' }}>Select Network</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {USDT_WALLETS.map((wallet) => (
            <button
              key={wallet.network}
              onClick={() => setSelectedNetwork(wallet.network)}
              style={{
                padding: '10px',
                background: selectedWallet?.network === wallet.network ? C.blue : C.surface,
                border: `1px solid ${selectedWallet?.network === wallet.network ? C.blue : C.border}`,
                borderRadius: '8px',
                cursor: 'pointer',
                color: selectedWallet?.network === wallet.network ? '#000' : C.text2,
                fontSize: '13px',
                fontWeight: '600',
              }}
            >
              {wallet.network.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* QR Code and Wallet Address */}
      {selectedWallet && (
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: '12px', padding: '24px', textAlign: 'center',
        }}>
          <p style={{ fontSize: '13px', color: C.text2, margin: '0 0 16px 0' }}>
            Scan QR Code to Pay
          </p>

          {selectedWallet.qr_code_url && (
            <div style={{
              background: '#fff', borderRadius: '12px', padding: '16px',
              display: 'inline-block', marginBottom: '16px',
            }}>
              <img
                src={selectedWallet.qr_code_url}
                alt={`USDT ${selectedWallet.network} QR Code`}
                width={200}
                height={200}
                style={{ borderRadius: '8px', display: 'block' }}
              />
            </div>
          )}

          <p style={{ fontSize: '13px', color: C.text2, margin: '0 0 8px 0' }}>
            Or copy wallet address
          </p>

          <div style={{
            display: 'flex', gap: '8px', background: '#070A0F',
            border: `1px solid ${C.border}`, borderRadius: '8px', padding: '12px',
          }}>
            <code style={{
              flex: 1, fontSize: '13px', color: C.text,
              wordBreak: 'break-all', fontFamily: 'monospace',
            }}>
              {selectedWallet.wallet_address}
            </code>
            <button
              onClick={() => copyToClipboard(selectedWallet.wallet_address)}
              style={{
                padding: '8px 12px', background: C.blue, color: '#000',
                border: 'none', borderRadius: '8px', fontSize: '12px',
                fontWeight: '600', cursor: 'pointer', flexShrink: 0,
              }}
            >
              {copied === selectedWallet.wallet_address ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <div style={{ textAlign: 'left', marginTop: '16px' }}>
            <div style={{
              background: '#070A0F', border: `1px solid ${C.border}`,
              borderRadius: '8px', padding: '12px',
            }}>
              <p style={{ fontSize: '12px', color: C.text2, margin: '0 0 4px 0' }}>Network</p>
              <p style={{ fontSize: '14px', fontWeight: '600', color: C.text, margin: 0 }}>
                {selectedWallet.network}
              </p>
            </div>
          </div>

          <div style={{
            marginTop: '16px', background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px',
            textAlign: 'left',
          }}>
            <p style={{ fontSize: '12px', color: C.red, margin: 0, fontWeight: '500' }}>
              IMPORTANT: Send only USDT using the selected network ({selectedWallet.network}).
              Sending other tokens or using the wrong network will result in permanent loss of funds.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
