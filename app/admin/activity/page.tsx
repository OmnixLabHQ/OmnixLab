'use client'

import { useState, useEffect } from 'react'

interface USDTWallet {
  network: string
  wallet_address: string
  memo_tag: string
  qr_code_url: string
}

export default function USDTPaymentInstructions({ invoiceId }: { invoiceId: string }) {
  const [wallets, setWallets] = useState<USDTWallet[]>([])
  const [selectedNetwork, setSelectedNetwork] = useState('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState('')
  const [qrError, setQrError] = useState(false)

  useEffect(() => {
    fetchInstructions()
  }, [])

  const fetchInstructions = async () => {
    try {
      const response = await fetch(`/api/billing/payment-instructions?method=usdt`)
      const data = await response.json()
      
      if (data.success && data.instructions?.wallets) {
        setWallets(data.instructions.wallets)
        setSelectedNetwork(data.instructions.wallets[0]?.network || '')
      }
    } catch (error) {
      console.error('Fetch USDT instructions error:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectedWallet = wallets.find(
    (w) => w.network === selectedNetwork
  )

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(''), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-6 w-6 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Network Selector */}
      <div>
        <label className="block text-sm text-gray-300 mb-2">Select Network</label>
        <div className="grid grid-cols-3 gap-2">
          {wallets.map((wallet) => (
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
          
          {/* Display exact QR code image from Supabase Storage */}
          <div className="bg-white rounded-xl p-4 inline-block mb-4">
            {selectedWallet.qr_code_url && !qrError ? (
              <img
                src={selectedWallet.qr_code_url}
                alt={`USDT ${selectedWallet.network} QR Code`}
                width={220}
                height={220}
                className="rounded-lg"
                onError={() => setQrError(true)}
              />
            ) : (
              <div className="w-[220px] h-[220px] flex items-center justify-center bg-gray-100 rounded-lg">
                <div className="text-center">
                  <p className="text-4xl mb-2">[QR]</p>
                  <p className="text-xs text-gray-500">
                    Scan with your wallet app
                  </p>
                </div>
              </div>
            )}
          </div>
          
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