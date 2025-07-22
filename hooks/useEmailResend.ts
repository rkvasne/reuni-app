'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'

export function useEmailResend() {
  const [canResend, setCanResend] = useState(true)
  const [cooldown, setCooldown] = useState(0)
  const [resending, setResending] = useState(false)
  const { signUpWithEmail } = useAuth()

  // Recuperar estado do localStorage na inicialização
  useEffect(() => {
    const savedState = localStorage.getItem('emailResendState')
    if (savedState) {
      try {
        const { lastResendAt, cooldownDuration } = JSON.parse(savedState)
        const now = Date.now()
        const elapsed = now - lastResendAt
        const remaining = Math.max(0, cooldownDuration - Math.floor(elapsed / 1000))
        
        if (remaining > 0) {
          setCanResend(false)
          setCooldown(remaining)
          startCountdown(remaining)
        }
      } catch (error) {
        // Se houver erro ao parsear, limpar o localStorage
        localStorage.removeItem('emailResendState')
      }
    }
  }, [])

  const startCountdown = (initialCooldown: number) => {
    let remaining = initialCooldown
    
    const interval = setInterval(() => {
      remaining -= 1
      setCooldown(remaining)
      
      if (remaining <= 0) {
        setCanResend(true)
        clearInterval(interval)
        localStorage.removeItem('emailResendState')
      }
    }, 1000)
  }

  const resendEmail = async (email: string) => {
    if (!canResend || resending) {
      return { error: 'Aguarde antes de tentar novamente' }
    }

    setResending(true)
    
    try {
      // Chamar a função de cadastro novamente
      const result = await signUpWithEmail(email)
      
      if (!result.error) {
        // Iniciar cooldown de 60 segundos
        const cooldownDuration = 60
        setCanResend(false)
        setCooldown(cooldownDuration)
        
        // Salvar estado no localStorage
        localStorage.setItem('emailResendState', JSON.stringify({
          lastResendAt: Date.now(),
          cooldownDuration
        }))
        
        startCountdown(cooldownDuration)
      }
      
      return result
    } catch (error: any) {
      return { error: error.message || 'Erro ao reenviar email' }
    } finally {
      setResending(false)
    }
  }

  return {
    resendEmail,
    canResend,
    cooldown,
    resending
  }
}