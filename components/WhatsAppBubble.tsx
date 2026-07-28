'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

export default function WhatsAppBubble() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      
      {/* Chat Options */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: isOpen ? 1 : 0, scale: isOpen ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col gap-3"
      >
        {/* Telegram Button */}
        <motion.a
          href="https://t.me/OmnixLab"
          target="_blank"
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-3 bg-white rounded-2xl shadow-xl px-4 py-3 border border-gray-100"
        >
          <span className="text-sm font-semibold text-gray-900">Chat on Telegram</span>
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.938z"/>
            </svg>
          </div>
        </motion.a>

        {/* WhatsApp Button */}
        <motion.a
          href="https://wa.me/2347033702874?text=Hello%20Omnix%20Lab!%20I'm%20interested%20in%20your%20services"
          target="_blank"
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-3 bg-white rounded-2xl shadow-xl px-4 py-3 border border-gray-100"
        >
          <span className="text-sm font-semibold text-gray-900">Chat on WhatsApp</span>
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
            </svg>
          </div>
        </motion.a>
      </motion.div>

      {/* Main Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{ 
          rotate: isOpen ? 45 : 0,
          boxShadow: [
            '0 0 0 0 rgba(99, 102, 241, 0.4)',
            '0 0 0 15px rgba(99, 102, 241, 0)',
            '0 0 0 0 rgba(99, 102, 241, 0)',
          ]
        }}
        transition={{ 
          boxShadow: { duration: 2, repeat: Infinity }
        }}
        className="w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-xl shadow-indigo-300 cursor-pointer"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
      </motion.button>
    </div>
  )
}