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
    <div className="space-y-4">
      {/* Network Selector */}
      <div>
        <label className="block text-sm text-gray-300 mb-2">Select Network</label>
        <div className="grid grid-cols-3 gap-2">
          {USDT_WALLETS.map((wallet) => (
            <button
              key={wallet.network}
              onClick={() => setSelectedNetwork(wallet.network)}
              className={`px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                selectedWallet?.network === wallet.network
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {wallet.network.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* QR Code and Wallet Address */}
      {selectedWallet && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
          <p className="text-sm text-gray-400 mb-4">Scan QR Code to Pay</p>

          {selectedWallet.qr_code_url && (
            <div className="bg-white rounded-xl p-4 inline-block mb-4">
              <img
                src={selectedWallet.qr_code_url}
                alt={`USDT ${selectedWallet.network} QR Code`}
                width={200}
                height={200}
                className="rounded-lg"
              />
            </div>
          )}

          <p className="text-sm text-gray-400 mb-2">Or copy wallet address</p>
          <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-lg p-3">
            <code className="flex-1 text-sm text-white break-all">
              {selectedWallet.wallet_address}
            </code>
            <button
              onClick={() => copyToClipboard(selectedWallet.wallet_address)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg shrink-0"
            >
              {copied === selectedWallet.wallet_address ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <div className="mt-4 text-left space-y-2">
            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
              <p className="text-xs text-gray-400">Network</p>
              <p className="text-sm text-white font-medium">{selectedWallet.network}</p>
            </div>
            {selectedWallet.memo_tag && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                <p className="text-xs text-gray-400">Memo/Tag</p>
                <p className="text-sm text-white font-medium">{selectedWallet.memo_tag}</p>
              </div>
            )}
          </div>

          <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p className="text-xs text-red-400 font-medium">
              IMPORTANT: Send only USDT using the selected network ({selectedWallet.network}). 
              Sending other tokens or using the wrong network will result in permanent loss of funds.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}