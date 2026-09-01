import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fqeyrtjlfnsxgwczcrvx.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// QR Code URLs - Upload your QR codes to Supabase Storage bucket "payment-qr-codes"
const QR_CODE_BASE_URL = `${supabaseUrl}/storage/v1/object/public/payment-qr-codes`

// Static payment instructions with your real bank details
const DEFAULT_INSTRUCTIONS: Record<string, any> = {
  // Bank Account 1 - Used for Bank Transfer, Wire Transfer, FedWire, Local Wire, Western Union
  bank_transfer: {
    method: 'bank_transfer',
    bank_name: 'Lead Bank',
    account_name: 'NATHANIEL ABIDEMI AKOMOLAFE',
    account_number: '214555267439',
    routing_number: '101019644',
    account_type: 'Personal Checking',
    bank_address: '9450 Southwest Gemini Drive, Beaverton, OR, 97008, USA',
    instructions: 'Please transfer the exact amount to the bank account above. Use your invoice number as reference. Upload proof of payment after transfer.',
  },
  
  wire_transfer: {
    method: 'wire_transfer',
    bank_name: 'Lead Bank',
    account_name: 'NATHANIEL ABIDEMI AKOMOLAFE',
    account_number: '214555267439',
    routing_number: '101019644',
    account_type: 'Personal Checking',
    bank_address: '9450 Southwest Gemini Drive, Beaverton, OR, 97008, USA',
    instructions: 'For international wire transfers, use the bank details above. Include your invoice number in the transfer reference. Upload proof of payment.',
  },
  
  fedwire: {
    method: 'fedwire',
    bank_name: 'Lead Bank',
    account_name: 'NATHANIEL ABIDEMI AKOMOLAFE',
    account_number: '214555267439',
    routing_number: '101019644',
    account_type: 'Personal Checking',
    bank_address: '9450 Southwest Gemini Drive, Beaverton, OR, 97008, USA',
    instructions: 'Use FedWire for domestic US transfers. Include your invoice number as reference. Upload proof of payment.',
  },
  
  local_wire: {
    method: 'local_wire',
    bank_name: 'Lead Bank',
    account_name: 'NATHANIEL ABIDEMI AKOMOLAFE',
    account_number: '214555267439',
    routing_number: '101019644',
    account_type: 'Personal Checking',
    bank_address: '9450 Southwest Gemini Drive, Beaverton, OR, 97008, USA',
    instructions: 'Transfer to the local bank account above. Include your invoice number as reference. Upload proof of payment.',
  },
  
  western_union: {
    method: 'western_union',
    bank_name: 'Lead Bank',
    account_name: 'NATHANIEL ABIDEMI AKOMOLAFE',
    account_number: '214555267439',
    routing_number: '101019644',
    account_type: 'Personal Checking',
    bank_address: '9450 Southwest Gemini Drive, Beaverton, OR, 97008, USA',
    instructions: 'Send via Western Union using the recipient details above. Use the MTCN as your payment reference. Upload Western Union receipt.',
  },
  
  // Bank Account 2 - Used for Remitly, WorldRemit, MoneyGram
  remitly: {
    method: 'remitly',
    bank_name: 'Lead Bank',
    account_name: 'Nathaniel Akomolafe',
    account_number: '213788278533',
    routing_number: '101019644',
    bank_address: '1801 Main St., Kansas City, MO 64108',
    instructions: 'Send via Remitly using the bank details above. Include your invoice number in the note. Upload Remitly confirmation.',
  },
  
  worldremit: {
    method: 'worldremit',
    bank_name: 'Lead Bank',
    account_name: 'Nathaniel Akomolafe',
    account_number: '213788278533',
    routing_number: '101019644',
    bank_address: '1801 Main St., Kansas City, MO 64108',
    instructions: 'Send via WorldRemit using the bank details above. Include your invoice number in the note. Upload WorldRemit confirmation.',
  },
  
  moneygram: {
    method: 'moneygram',
    bank_name: 'Lead Bank',
    account_name: 'Nathaniel Akomolafe',
    account_number: '213788278533',
    routing_number: '101019644',
    bank_address: '1801 Main St., Kansas City, MO 64108',
    instructions: 'Send via MoneyGram using the bank details above. Use the reference number as your payment reference. Upload MoneyGram receipt.',
  },
  
  // USDT - All 3 networks with QR codes
  usdt: {
    method: 'usdt',
    wallets: [
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
    ],
    instructions: 'Send USDT to one of the wallet addresses below. Make sure to use the correct network. Include your invoice number in the memo. Upload transaction hash as proof of payment.',
  },
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const method = searchParams.get('method')
    const network = searchParams.get('network')

    console.log('Payment instructions requested for method:', method)

    // For USDT with specific network
    if (method === 'usdt' && network) {
      const usdtInstructions = DEFAULT_INSTRUCTIONS.usdt
      const wallet = usdtInstructions.wallets.find(
        (w: any) => w.network.toLowerCase().includes(network.toLowerCase())
      )
      
      if (wallet) {
        return NextResponse.json({
          success: true,
          instructions: {
            method: 'usdt',
            wallet_address: wallet.wallet_address,
            network: wallet.network,
            memo_tag: wallet.memo_tag,
            qr_code_url: wallet.qr_code_url,
            instructions: usdtInstructions.instructions,
          },
        })
      }
    }

    // Try database first
    if (method) {
      try {
        const { data: dbInstructions, error: dbError } = await supabaseAdmin
          .from('payment_instructions')
          .select('*')
          .eq('method', method)
          .eq('is_active', true)
          .single()

        if (!dbError && dbInstructions) {
          console.log('Found instructions in database')
          return NextResponse.json({ 
            success: true, 
            instructions: dbInstructions 
          })
        }
      } catch (dbError) {
        console.log('Database lookup failed, using static instructions')
      }
    }

    // Fallback to static instructions
    if (method && DEFAULT_INSTRUCTIONS[method]) {
      console.log('Returning static instructions for:', method)
      return NextResponse.json({ 
        success: true, 
        instructions: DEFAULT_INSTRUCTIONS[method] 
      })
    }

    // Return all instructions
    return NextResponse.json({ 
      success: true, 
      instructions: Object.values(DEFAULT_INSTRUCTIONS) 
    })

  } catch (error) {
    console.error('Payment instructions GET error:', error)
    return NextResponse.json({ 
      success: true, 
      instructions: Object.values(DEFAULT_INSTRUCTIONS) 
    })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { method, ...instructionData } = body

    if (!method) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing payment method' 
      }, { status: 400 })
    }

    console.log('Creating payment instruction for:', method)

    // Try to save to database
    try {
      const { data, error } = await supabaseAdmin
        .from('payment_instructions')
        .upsert({
          method,
          ...instructionData,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (!error && data) {
        return NextResponse.json({ success: true, instruction: data })
      }
    } catch (dbError) {
      console.log('Database save failed (non-fatal):', dbError)
    }

    return NextResponse.json({ 
      success: true, 
      instruction: { method, ...instructionData } 
    })

  } catch (error) {
    console.error('Payment instructions POST error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
