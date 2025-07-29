'use client';

import { useState } from 'react';
import { Filter, Calendar, MapPin, Users, Tag } from 'lucide-react';

interface FilterOptions {
  categoria: string;
  data: string;
  local: string;
  participantes: string;
}

interface AdvancedFilterBarProps {
  onFiltersChange: (filters: FilterOptions) => void;
  className?: string;
}

export default function AdvancedFilterBar({
  onFiltersChange,
  className = ""
}: AdvancedFilterBarProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    categoria: '',
    data: '',
    local: '',
    participantes: ''
  });
  
  const [showAdvanced, setShowAdvanced] = useState(false);

  const categorias = [
    'Arte', 'Educação', 'Esportes', 'Gastronomia', 'Música', 
    'Negócios', 'Outros', 'Saúde', 'Tecnologia', 'Viagem'
  ];

  const dataOptions = [
    { value: 'hoje', label: 'Hoje' },
    { value: 'amanha', label: 'Amanhã' },
    { value: 'semana', label: 'Esta semana' },
    { value: 'mes', label: 'Este mês' },
    { value: 'futuro', label: 'Todos futuros' }
  ];

  const participantesOptions = [
    { value: 'pequeno', label: 'Até 20 pessoas' },
    { value: 'medio', label: '20-50 pessoas' },
    { value: 'grande', label: '50+ pessoas' }
  ];

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters = { categoria: '', data: '', local: '', participantes: '' };
    setFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <div className={`bg-white rounded-lg border border-neutral-200 p-4 ${className}`}>
      {/* Filtros básicos - sempre visíveis */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        {/* Categoria */}
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-neutral-500" />
          <select
            value={filters.categoria}
            onChange={(e) => handleFilterChange('categoria', e.target.value)}
            className="border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Todas as categorias</option>
            {categorias.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Data */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-neutral-500" />
          <select
            value={filters.data}
            onChange={(e) => handleFilterChange('data', e.target.value)}
            className="border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Qualquer data</option>
            {dataOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        {/* Botão filtros avançados */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            showAdvanced 
              ? 'bg-primary-100 text-primary-700' 
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filtros avançados
        </button>

        {/* Limpar filtros */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-neutral-500 hover:text-neutral-700 underline"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Filtros avançados - colapsáveis */}
      {showAdvanced && (
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-neutral-200">
          {/* Local */}
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Filtrar por local..."
              value={filters.local}
              onChange={(e) => handleFilterChange('local', e.target.value)}
              className="border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-48"
            />
          </div>

          {/* Participantes */}
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-neutral-500" />
            <select
              value={filters.participantes}
              onChange={(e) => handleFilterChange('participantes', e.target.value)}
              className="border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Qualquer tamanho</option>
              {participantesOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Indicadores de filtros ativos */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-neutral-200">
          {filters.categoria && (
            <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded-full text-xs font-medium">
              {filters.categoria}
            </span>
          )}
          {filters.data && (
            <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded-full text-xs font-medium">
              {dataOptions.find(opt => opt.value === filters.data)?.label}
            </span>
          )}
          {filters.local && (
            <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded-full text-xs font-medium">
              Local: {filters.local}
            </span>
          )}
          {filters.participantes && (
            <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded-full text-xs font-medium">
              {participantesOptions.find(opt => opt.value === filters.participantes)?.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}