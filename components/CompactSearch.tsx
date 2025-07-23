'use client'

import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function CompactSearch() {
  const router = useRouter()

  return (
    <div className="card p-3 bg-gradient-to-r from-primary-50 to-secondary-50 border border-primary-100">
      <button
        onClick={() => router.push('/search')}
        className="w-full flex items-center gap-3 text-left group"
      >
        <div className="p-2 bg-white rounded-lg group-hover:bg-primary-100 transition-colors">
          <Search className="w-4 h-4 text-primary-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-primary-800">Buscar eventos específicos?</p>
          <p className="text-xs text-primary-600">Use filtros avançados, categorias e localização</p>
        </div>
        <div className="ml-auto text-primary-600 text-sm font-medium">
          →
        </div>
      </button>
    </div>
  )
}