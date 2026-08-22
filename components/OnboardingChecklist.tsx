'use client'
import { useState, useEffect } from 'react'

export default function OnboardingChecklist() {
  const [visible, setVisible] = useState(false)
  const [done, setDone] = useState<string[]>([])

  useEffect(() => {
    const dismissed = localStorage.getItem('onboarding-dismissed')
    if (!dismissed) setVisible(true)
    const completed = JSON.parse(localStorage.getItem('onboarding-done') || '[]')
    setDone(completed)
  }, [])

  const completeStep = (step: string) => {
    const newDone = [...done, step]
    setDone(newDone)
    localStorage.setItem('onboarding-done', JSON.stringify(newDone))
  }

  const dismiss = () => {
    localStorage.setItem('onboarding-dismissed', 'true')
    setVisible(false)
  }

  if (!visible) return null

  const steps = [
    { id: 'profile', label: 'Complete your profile', completed: done.includes('profile') },
    { id: 'project', label: 'View your project', completed: done.includes('project') },
    { id: 'upload', label: 'Upload requirements', completed: done.includes('upload') },
    { id: 'payment', label: 'Make first payment', completed: done.includes('payment') },
  ]

  return (
    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-indigo-900 dark:text-indigo-200">🚀 Getting Started</h3>
        <button onClick={dismiss} className="text-sm text-gray-500 hover:text-gray-700">Dismiss</button>
      </div>
      <div className="space-y-2">
        {steps.map(step => (
          <button
            key={step.id}
            onClick={() => completeStep(step.id)}
            className="flex items-center gap-3 w-full text-left p-2 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-800/30 transition"
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${step.completed ? 'bg-green-500 text-white' : 'bg-gray-300'}`}>
              {step.completed ? '✓' : '○'}
            </span>
            <span className={step.completed ? 'line-through text-gray-500' : 'text-gray-800 dark:text-gray-200'}>{step.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
} 
