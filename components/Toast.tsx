'use client'

import { useEffect, useState } from 'react'
import { Check, AlertCircle, X } from 'lucide-react'

interface ToastProps {
  type: 'success' | 'error' | 'info'
  message: string
  isVisible: boolean
  onClose: () => void
  duration?: number
}

export default function Toast({ 
  type, 
  message, 
  isVisible, 
  onClose, 
  duration = 3000 
}: ToastProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true)
      const timer = setTimeout(() => {
        setIsAnimating(false)
        setTimeout(onClose, 200) // Aguardar animação de saída
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  if (!isVisible) return null

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white'
      case 'error':
        return 'bg-red-500 text-white'
      case 'info':
        return 'bg-blue-500 text-white'
      default:
        return 'bg-neutral-500 text-white'
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <Check className="w-5 h-5" />
      case 'error':
        return <AlertCircle className="w-5 h-5" />
      case 'info':
        return <AlertCircle className="w-5 h-5" />
      default:
        return null
    }
  }

  return (
    <div className={`
      fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2
      transition-all duration-200 ease-in-out
      ${getToastStyles()}
      ${isAnimating 
        ? 'translate-x-0 opacity-100' 
        : 'translate-x-full opacity-0'
      }
    `}>
      {getIcon()}
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={() => {
          setIsAnimating(false)
          setTimeout(onClose, 200)
        }}
        className="ml-2 hover:opacity-80 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}