/**
 * Utilitário para limpeza completa de dados de autenticação
 * Remove tokens corrompidos e reseta estado
 */

import { supabase } from '@/lib/supabase'

export async function clearAuthData() {
  try {
    // 1. Fazer logout no Supabase
    await supabase.auth.signOut()
    
    // 2. Limpar localStorage
    const localStorageKeys = Object.keys(localStorage)
    localStorageKeys.forEach(key => {
      if (key.includes('supabase') || 
          key.includes('sb-') || 
          key.includes('auth') || 
          key.includes('session') ||
          key.includes('token')) {
        localStorage.removeItem(key)
        console.log(`🧹 Removido localStorage: ${key}`)
      }
    })

    // 3. Limpar sessionStorage
    const sessionStorageKeys = Object.keys(sessionStorage)
    sessionStorageKeys.forEach(key => {
      if (key.includes('supabase') || 
          key.includes('sb-') || 
          key.includes('auth') || 
          key.includes('session') ||
          key.includes('token')) {
        sessionStorage.removeItem(key)
        console.log(`🧹 Removido sessionStorage: ${key}`)
      }
    })

    // 4. Limpar cookies relacionados
    document.cookie.split(";").forEach(cookie => {
      const eqPos = cookie.indexOf("=")
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
      if (name.includes('supabase') || 
          name.includes('sb-') || 
          name.includes('auth') || 
          name.includes('session') ||
          name.includes('token')) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
        console.log(`🧹 Removido cookie: ${name}`)
      }
    })

    console.log('✅ Dados de autenticação limpos completamente')
    return true
  } catch (error) {
    console.error('❌ Erro ao limpar dados de autenticação:', error)
    return false
  }
}

export function addClearAuthToWindow() {
  if (typeof window !== 'undefined') {
    (window as any).clearAuth = clearAuthData
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Função window.clearAuth() disponível no console para debug.')
    }
  }
}
