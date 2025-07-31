'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface SupabaseStatusProps {
  children: React.ReactNode;
}

export default function SupabaseStatus({ children }: SupabaseStatusProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkSupabaseStatus();
  }, []);

  const checkSupabaseStatus = async () => {
    try {
      setIsLoading(true);
      
      // Teste simples de conectividade
      const { data, error } = await supabase
        .from('eventos')
        .select('count')
        .limit(1);

      if (error) {
        throw error;
      }

      setIsOnline(true);
      setError(null);
    } catch (err: any) {
      console.error('Erro de conectividade Supabase:', err);
      setIsOnline(false);
      
      // Identificar tipo de erro
      if (err.message?.includes('503') || err.message?.includes('Service Unavailable')) {
        setError('Serviço temporariamente indisponível');
      } else if (err.message?.includes('timeout')) {
        setError('Timeout de conexão');
      } else if (err.message?.includes('network')) {
        setError('Erro de rede');
      } else {
        setError('Erro de conexão com o banco de dados');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const retry = () => {
    checkSupabaseStatus();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Conectando ao banco de dados...</p>
        </div>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center p-6 bg-white rounded-lg shadow-lg">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Serviço Indisponível
          </h2>
          <p className="text-gray-600 mb-4">
            {error || 'Não foi possível conectar ao banco de dados'}
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-yellow-800 mb-2">Possíveis causas:</h3>
            <ul className="text-sm text-yellow-700 text-left space-y-1">
              <li>• Projeto Supabase pausado por inatividade</li>
              <li>• Manutenção temporária do servidor</li>
              <li>• Problema de conectividade</li>
              <li>• Limite de uso excedido</li>
            </ul>
          </div>

          <div className="space-y-3">
            <button
              onClick={retry}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔄 Tentar Novamente
            </button>
            
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              🔧 Abrir Dashboard Supabase
            </a>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Se o problema persistir, verifique o status do seu projeto no Supabase Dashboard
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}