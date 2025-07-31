/**
 * Utilitário para retry automático em operações Supabase
 */

import { supabase } from '@/lib/supabase';

interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: boolean;
}

/**
 * Executa uma operação Supabase com retry automático
 */
export async function withRetry<T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  options: RetryOptions = {}
): Promise<{ data: T | null; error: any }> {
  const { maxAttempts = 3, delay = 1000, backoff = true } = options;
  
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`🔄 Tentativa ${attempt}/${maxAttempts}`);
      
      const result = await operation();
      
      // Se não há erro, retorna o resultado
      if (!result.error) {
        if (attempt > 1) {
          console.log(`✅ Sucesso na tentativa ${attempt}`);
        }
        return result;
      }
      
      // Se há erro, verifica se deve tentar novamente
      lastError = result.error;
      
      // Erros que não devem ser retentados
      const nonRetryableErrors = [
        'PGRST116', // Tabela não encontrada
        'PGRST301', // Erro de sintaxe
        '42P01',    // Tabela não existe
        '42703'     // Coluna não existe
      ];
      
      const shouldRetry = !nonRetryableErrors.some(code => 
        result.error.code === code || result.error.message?.includes(code)
      );
      
      if (!shouldRetry) {
        console.log(`❌ Erro não recuperável: ${result.error.message}`);
        return result;
      }
      
      // Se não é a última tentativa, aguarda antes de tentar novamente
      if (attempt < maxAttempts) {
        const waitTime = backoff ? delay * Math.pow(2, attempt - 1) : delay;
        console.log(`⏳ Aguardando ${waitTime}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
    } catch (error) {
      lastError = error;
      console.error(`❌ Erro na tentativa ${attempt}:`, error);
      
      if (attempt < maxAttempts) {
        const waitTime = backoff ? delay * Math.pow(2, attempt - 1) : delay;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  console.error(`💥 Todas as ${maxAttempts} tentativas falharam`);
  return { data: null, error: lastError };
}

/**
 * Busca eventos com retry automático
 */
export async function fetchEventosWithRetry() {
  return withRetry(
    async () => {
      const result = await supabase
        .from('eventos')
        .select(`
          *,
          organizador:usuarios!organizador_id(nome, email, avatar)
        `)
        .order('data', { ascending: true });
      return result;
    },
    { maxAttempts: 3, delay: 1000 }
  );
}

/**
 * Busca participações com retry automático
 */
export async function fetchParticipacoesWithRetry(eventoId: string) {
  return withRetry(
    async () => {
      const result = await supabase
        .from('participacoes')
        .select('*')
        .eq('evento_id', eventoId)
        .eq('status', 'confirmado');
      return result;
    },
    { maxAttempts: 3, delay: 500 }
  );
}

/**
 * Busca um evento específico com retry automático
 */
export async function fetchEventoWithRetry(eventoId: string) {
  return withRetry(
    async () => {
      const result = await supabase
        .from('eventos')
        .select(`
          *,
          organizador:usuarios!organizador_id(nome, email, avatar)
        `)
        .eq('id', eventoId)
        .single();
      return result;
    },
    { maxAttempts: 3, delay: 1000 }
  );
}

/**
 * Verifica status de conectividade
 */
export async function checkSupabaseHealth(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('eventos')
      .select('count')
      .limit(1);
    
    return !error;
  } catch {
    return false;
  }
}