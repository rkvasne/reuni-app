'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface SupabaseStatus {
  isOnline: boolean;
  isLoading: boolean;
  error: string | null;
  lastCheck: Date | null;
  retry: () => void;
}

export function useSupabaseStatus(): SupabaseStatus {
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Teste rápido de conectividade
      const startTime = Date.now();
      const { error: testError } = await supabase
        .from('eventos')
        .select('count')
        .limit(1);

      const responseTime = Date.now() - startTime;

      if (testError) {
        throw testError;
      }

      setIsOnline(true);
      setError(null);
      setLastCheck(new Date());
      
      // Log para debug
      console.log(`✅ Supabase online - Tempo de resposta: ${responseTime}ms`);
      
    } catch (err: any) {
      console.error('❌ Supabase offline:', err);
      setIsOnline(false);
      setLastCheck(new Date());
      
      // Categorizar erros
      let errorMessage = 'Erro desconhecido';
      
      if (err.message?.includes('503') || err.message?.includes('Service Unavailable')) {
        errorMessage = 'Serviço temporariamente indisponível (503)';
      } else if (err.message?.includes('502') || err.message?.includes('Bad Gateway')) {
        errorMessage = 'Erro de gateway (502)';
      } else if (err.message?.includes('timeout')) {
        errorMessage = 'Timeout de conexão';
      } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
        errorMessage = 'Erro de rede';
      } else if (err.message?.includes('upstream connect error')) {
        errorMessage = 'Erro de conexão upstream - Projeto pode estar pausado';
      } else if (err.message?.includes('connection timeout')) {
        errorMessage = 'Timeout de conexão - Servidor sobrecarregado';
      } else {
        errorMessage = `Erro: ${err.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const retry = useCallback(() => {
    checkStatus();
  }, [checkStatus]);

  useEffect(() => {
    // Verificação inicial
    checkStatus();

    // Verificação periódica (a cada 30 segundos quando offline)
    const interval = setInterval(() => {
      if (!isOnline) {
        checkStatus();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [checkStatus, isOnline]);

  // Verificação quando a aba volta ao foco
  useEffect(() => {
    const handleFocus = () => {
      if (!isOnline) {
        checkStatus();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [checkStatus, isOnline]);

  return {
    isOnline,
    isLoading,
    error,
    lastCheck,
    retry
  };
}