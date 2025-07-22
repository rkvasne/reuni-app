'use client'

import { AlertTriangle, ExternalLink } from 'lucide-react'

interface RLSWarningProps {
  message: string
  onDismiss?: () => void
}

export default function RLSWarning({ message, onDismiss }: RLSWarningProps) {
  if (!message.includes('RLS')) return null

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-yellow-800 mb-2">
            Configuração do Supabase Necessária
          </h3>
          <p className="text-sm text-yellow-700 mb-3">
            {message}
          </p>
          <div className="text-sm text-yellow-700 mb-3">
            Para corrigir este problema, você precisa configurar as políticas de Row Level Security (RLS) no Supabase.
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/SUPABASE_RLS_FIX.md"
              target="_blank"
              className="inline-flex items-center gap-2 text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
            >
              <ExternalLink className="w-4 h-4" />
              Ver instruções de correção
            </a>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-sm font-medium text-yellow-800 hover:text-yellow-900"
              >
                Dispensar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}