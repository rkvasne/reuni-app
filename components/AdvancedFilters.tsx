'use client'

import { useState } from 'react'
import { X, Calendar, MapPin, User, Tag, SlidersHorizontal, RotateCcw } from 'lucide-react'
import { useSearch } from '@/hooks/useSearch'

interface AdvancedFiltersProps {
  isOpen: boolean
  onClose: () => void
}

const categorias = [
  'Tecnologia',
  'Música',
  'Esporte',
  'Educação',
  'Gastronomia',
  'Arte',
  'Negócios',
  'Saúde',
  'Entretenimento',
  'Outros'
]

const statusOptions = [
  { value: 'todos', label: 'Todos os eventos' },
  { value: 'futuros', label: 'Eventos futuros' },
  { value: 'passados', label: 'Eventos passados' },
  { value: 'lotados', label: 'Eventos lotados' }
]

const sortOptions = [
  { value: 'data', label: 'Data do evento' },
  { value: 'popularidade', label: 'Popularidade' },
  { value: 'relevancia', label: 'Relevância' },
  { value: 'criacao', label: 'Mais recentes' }
]

export default function AdvancedFilters({ isOpen, onClose }: AdvancedFiltersProps) {
  const { filters, options, updateFilters, updateOptions, clearFilters } = useSearch()
  const [tempFilters, setTempFilters] = useState(filters)
  const [tempOptions, setTempOptions] = useState(options)

  if (!isOpen) return null

  const handleApply = () => {
    updateFilters(tempFilters)
    updateOptions(tempOptions)
    onClose()
  }

  const handleReset = () => {
    clearFilters()
    setTempFilters({
      query: '',
      categoria: '',
      dataInicio: '',
      dataFim: '',
      local: '',
      organizador: '',
      status: 'futuros'
    })
    setTempOptions({
      sortBy: 'data',
      sortOrder: 'asc',
      page: 1,
      limit: 12
    })
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (tempFilters.categoria) count++
    if (tempFilters.dataInicio || tempFilters.dataFim) count++
    if (tempFilters.local) count++
    if (tempFilters.status !== 'futuros') count++
    return count
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="w-5 h-5 text-primary-500" />
            <h2 className="text-xl font-semibold text-neutral-800">
              Filtros Avançados
            </h2>
            {getActiveFiltersCount() > 0 && (
              <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded-full text-xs font-medium">
                {getActiveFiltersCount()} ativo{getActiveFiltersCount() > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-neutral-600" />
          </button>
        </div>

        {/* Filtros */}
        <div className="p-6 space-y-6">
          
          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Categoria
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <button
                onClick={() => setTempFilters(prev => ({ ...prev, categoria: '' }))}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !tempFilters.categoria
                    ? 'bg-primary-500 text-white'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                }`}
              >
                Todas
              </button>
              {categorias.map((categoria) => (
                <button
                  key={categoria}
                  onClick={() => setTempFilters(prev => ({ ...prev, categoria }))}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    tempFilters.categoria === categoria
                      ? 'bg-primary-500 text-white'
                      : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                  }`}
                >
                  {categoria}
                </button>
              ))}
            </div>
          </div>

          {/* Data */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Período
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-neutral-600 mb-1">Data inicial</label>
                <input
                  type="date"
                  value={tempFilters.dataInicio}
                  onChange={(e) => setTempFilters(prev => ({ ...prev, dataInicio: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-600 mb-1">Data final</label>
                <input
                  type="date"
                  value={tempFilters.dataFim}
                  onChange={(e) => setTempFilters(prev => ({ ...prev, dataFim: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Local */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Local
            </label>
            <input
              type="text"
              value={tempFilters.local}
              onChange={(e) => setTempFilters(prev => ({ ...prev, local: e.target.value }))}
              placeholder="Ex: São Paulo, Centro, Online..."
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-3">
              Status do Evento
            </label>
            <div className="grid grid-cols-2 gap-2">
              {statusOptions.map((status) => (
                <button
                  key={status.value}
                  onClick={() => setTempFilters(prev => ({ ...prev, status: status.value as any }))}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    tempFilters.status === status.value
                      ? 'bg-primary-500 text-white'
                      : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ordenação */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-3">
              Ordenar por
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={tempOptions.sortBy}
                onChange={(e) => setTempOptions(prev => ({ ...prev, sortBy: e.target.value as any }))}
                className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={tempOptions.sortOrder}
                onChange={(e) => setTempOptions(prev => ({ ...prev, sortOrder: e.target.value as any }))}
                className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="asc">Crescente</option>
                <option value="desc">Decrescente</option>
              </select>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-neutral-200">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Limpar Filtros
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleApply}
              className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}