import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, amount, invoiceId } = await request.json()
  if (!email || !amount || !invoiceId) {
    return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 })
  }

  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: Math.round(amount * 100),
      currency: 'NGN',
      metadata: { invoiceId },
      callback_url: 'https://omnixlab-production.up.railway.app/portal/payments',
    }),
  })

  const data = await response.json()
  if (!data.status) {
    return NextResponse.json({ success: false, error: data.message })
  }
  return NextResponse.json({ success: true, authorization_url: data.data.authorization_url, reference: data.data.reference })
}