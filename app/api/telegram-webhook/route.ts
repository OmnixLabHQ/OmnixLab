import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fqeyrtjlfnsxgwczcrvx.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

const TELEGRAM_BOT = '8870833593:AAGnId0fJ7pgSCaiGHmSzgmLgpYiOUBpe8c'

async function sendTelegramMessage(chatId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (body.callback_query) {
      const callback = body.callback_query
      const data = callback.data
      const chatId = callback.message.chat.id
      const messageId = callback.message.message_id

      if (data.startsWith('approve:')) {
        const userId = data.split(':')[1]

        // Update client as approved
        const { error } = await supabaseAdmin
          .from('clients')
          .update({ approved: true })
          .eq('id', userId)

        if (error) {
          await sendTelegramMessage(chatId, `❌ Error approving user: ${error.message}`)
          return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        // Create welcome notification
        await supabaseAdmin.from('notifications').insert({
          client_id: userId,
          type: 'account',
          title: 'Account Approved! 🎉',
          message: 'Your account has been approved. Welcome to Omnix Lab!',
          data: { status: 'approved' },
        })

        // Answer callback
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ callback_query_id: callback.id, text: '✅ User approved!' }),
        })

        // Update Telegram message
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT}/editMessageText`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            message_id: messageId,
            text: '✅ USER APPROVED',
          }),
        })

        // Send welcome email
        try {
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://omnixlab-production.up.railway.app'}/api/onboarding/send-welcome`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId: userId }),
          })
        } catch (emailError) {
          console.error('Welcome email error:', emailError)
        }
      }

      if (data.startsWith('reject:')) {
        const userId = data.split(':')[1]

        // Update client as rejected
        await supabaseAdmin
          .from('clients')
          .update({ approved: false })
          .eq('id', userId)

        // Create notification
        await supabaseAdmin.from('notifications').insert({
          client_id: userId,
          type: 'account',
          title: 'Account Not Approved',
          message: 'Your account was not approved. Please contact support.',
          data: { status: 'rejected' },
        })

        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ callback_query_id: callback.id, text: '❌ User rejected' }),
        })

        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT}/editMessageText`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            message_id: messageId,
            text: '❌ USER REJECTED',
          }),
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Telegram webhook error:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}