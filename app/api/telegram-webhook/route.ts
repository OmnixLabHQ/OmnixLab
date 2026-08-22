import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const TELEGRAM_BOT = '8870833593:AAGnId0fJ7pgSCaiGHmSzgmLgpYiOUBpe8c'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (body.callback_query) {
      const callback = body.callback_query
      const data = callback.data       // e.g. "approve:USER_ID"
      const chatId = callback.message.chat.id
      const messageId = callback.message.message_id

      if (data.startsWith('approve:')) {
        const userId = data.split(':')[1]
        const { error } = await supabaseAdmin
          .from('clients')
          .update({ approved: true })
          .eq('id', userId)

        if (error) {
          await sendTelegramMessage(chatId, `❌ Approval failed: ${error.message}`)
        } else {
          await sendTelegramMessage(chatId, `✅ User approved! They can now log in.`)
          // Remove buttons
          await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT}/editMessageReplyMarkup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              message_id: messageId,
              reply_markup: { inline_keyboard: [] }
            })
          })
        }
      } else if (data.startsWith('reject:')) {
        const userId = data.split(':')[1]
        // Optionally delete user from auth and clients
        await sendTelegramMessage(chatId, `❌ User rejected. Consider deleting them from Supabase.`)
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT}/editMessageReplyMarkup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            message_id: messageId,
            reply_markup: { inline_keyboard: [] }
          })
        })
      }

      // Answer callback to stop loading
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: callback.id })
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

async function sendTelegramMessage(chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text })
  })
}