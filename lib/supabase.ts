import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Verificar se as variáveis de ambiente estão configuradas
if (supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder-key') {
  console.warn('⚠️ Supabase não configurado! Crie um arquivo .env.local com suas credenciais.')
  console.warn('📋 Consulte o arquivo SETUP.md para instruções detalhadas.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para o banco de dados
export interface User {
  id: string
  nome: string
  email: string
  avatar?: string
  bio?: string
  created_at: string
}

export interface Event {
  id: string
  titulo: string
  descricao: string
  data: string
  hora: string
  local: string
  categoria: string
  imagem_url?: string
  organizador_id: string
  created_at: string
}

export interface Presence {
  id: string
  evento_id: string
  usuario_id: string
  status: 'confirmado' | 'interessado' | 'cancelado'
  created_at: string
}

export interface Community {
  id: string
  nome: string
  descricao: string
  tipo: string
  criador_id: string
  created_at: string
}

export interface Comment {
  id: string
  evento_id: string
  usuario_id: string
  conteudo: string
  created_at: string
}