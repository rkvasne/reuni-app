'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Filter, X } from 'lucide-react';

interface FilterOptions {
  periodo: string;
  categorias: string[];
  local: string;
}

interface VisualFilterBarProps {
  onFiltersChange: (filters: FilterOptions) => void;
  className?: string;
}

export default function VisualFilterBar({
  onFiltersChange,
  className = ""
}: VisualFilterBarProps) {
  const router = useRouter();
  const [filters, setFilters] = useState<FilterOptions>({
    periodo: '',
    categorias: [],
    local: ''
  });
  
  const [showAdvanced, setShowAdvanced] = useState(false);

  const periodos = [
    { value: 'todos', label: 'Todos', icon: '📅', color: 'bg-purple-500 text-white' },
    { value: 'hoje', label: 'Hoje', icon: '📍', color: 'bg-red-100 text-red-700' },
    { value: 'semana', label: 'Esta Semana', icon: '📊', color: 'bg-blue-100 text-blue-700' },
    { value: 'mes', label: 'Este Mês', icon: '🗓️', color: 'bg-green-100 text-green-700' }
  ];

  const categorias = [
    { value: 'tecnologia', label: 'Tecnologia', icon: '💻', color: 'bg-blue-100 text-blue-700' },
    { value: 'esportes', label: 'Esportes', icon: '⚽', color: 'bg-blue-100 text-blue-700' },
    { value: 'arte', label: 'Arte', icon: '🎨', color: 'bg-red-100 text-red-700' },
    { value: 'musica', label: 'Música', icon: '🎵', color: 'bg-purple-100 text-purple-700' },
    { value: 'culinaria', label: 'Culinária', icon: '🍳', color: 'bg-gray-100 text-gray-700' },
    { value: 'negocios', label: 'Negócios', icon: '💼', color: 'bg-gray-100 text-gray-700' }
  ];

  const locais = [
    { value: 'proximo', label: 'Próximo', icon: '📍', color: 'bg-pink-100 text-pink-700' },
    { value: 'online', label: 'Online', icon: '🌐', color: 'bg-blue-100 text-blue-700' }
  ];

  const handlePeriodoChange = (periodo: string) => {
    const newFilters = { ...filters, periodo };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleCategoriaToggle = (categoria: string) => {
    const newCategorias = filters.categorias.includes(categoria)
      ? filters.categorias.filter(c => c !== categoria)
      : [...filters.categorias, categoria];
    
    const newFilters = { ...filters, categorias: newCategorias };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleLocalChange = (local: string) => {
    const newFilters = { ...filters, local };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters = { periodo: '', categorias: [], local: '' };
    setFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const hasActiveFilters = filters.periodo || filters.categorias.length > 0 || filters.local;

  return (
    <div className={`bg-white rounded-lg border border-neutral-200 p-4 ${className}`}>


      {/* Período */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-neutral-700 mb-2 text-left">Período</h4>
        <div className="grid grid-cols-2 gap-2">
          {periodos.map((periodo) => (
            <button
              key={periodo.value}
              onClick={() => handlePeriodoChange(periodo.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 flex items-center gap-2 justify-start ${
                filters.periodo === periodo.value
                  ? periodo.color
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              <span>{periodo.icon}</span>
              {periodo.label}
            </button>
          ))}
        </div>
      </div>

      {/* Categorias */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-neutral-700 mb-2 text-left">Categorias</h4>
        <div className="grid grid-cols-2 gap-3">
          {categorias.map((categoria) => (
            <button
              key={categoria.value}
              onClick={() => handleCategoriaToggle(categoria.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 flex items-center gap-2 justify-start ${
                filters.categorias.includes(categoria.value)
                  ? categoria.color
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              <span>{categoria.icon}</span>
              {categoria.label}
            </button>
          ))}
        </div>
      </div>

      {/* Local */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-neutral-700 mb-2 text-left" style={{fontFamily: 'Poppins, Inter, system-ui, sans-serif', fontWeight: '600'}}>Local</h4>
        <div className="grid grid-cols-2 gap-3">
          {locais.map((local) => (
            <button
              key={local.value}
              onClick={() => handleLocalChange(local.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 flex items-center gap-2 justify-start min-h-[40px] ${
                filters.local === local.value
                  ? local.color
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              <span>{local.icon}</span>
              {local.label}
            </button>
          ))}
        </div>
      </div>

      {/* Footer com Limpar Filtros e Busca Avançada */}
      <div className="pt-4 border-t border-neutral-200 flex justify-between items-center">
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-neutral-500 hover:text-neutral-700 underline flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Limpar filtros
          </button>
        )}
        {!hasActiveFilters && <div></div>}
        <button 
          onClick={() => router.push('/search')}
          className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
        >
          Busca avançada →
        </button>
      </div>
    </div>
  );
}