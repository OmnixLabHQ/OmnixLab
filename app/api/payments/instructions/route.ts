import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fqeyrtjlfnsxgwczcrvx.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// USDT wallet details with QR codes
const QR_CODE_BASE_URL = `${supabaseUrl}/storage/v1/object/public/payment-qr-codes`

const USDT_WALLETS = [
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const method = searchParams.get('method')

    if (!method) {
      return NextResponse.json({ 
        success: false, 
        error: 'Payment method is required' 
      }, { status: 400 })
    }

    // For USDT, return wallet addresses with QR codes
    if (method.toLowerCase() === 'usdt') {
      return NextResponse.json({
        success: true,
        instructions: {
          method: 'usdt',
          wallets: USDT_WALLETS,
          instructions: 'Send USDT to one of the wallet addresses below. Use the correct network.',
        },
      })
    }

    // Fetch instructions from payment_methods table
    const { data: methodData, error } = await supabaseAdmin
      .from('payment_methods')
      .select('*')
      .ilike('name', `%${method}%`)
      .eq('active', true)
      .single()

    if (error || !methodData) {
      return NextResponse.json({ 
        success: false, 
        error: 'Payment method not found' 
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      instructions: {
        method: methodData.name,
        type: methodData.type,
        instructions: methodData.instructions,
      },
    })

  } catch (error) {
    console.error('Payment instructions API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
