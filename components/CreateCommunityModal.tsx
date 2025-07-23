'use client';

import { useState } from 'react';
import { X, Users, Image, Globe, Lock, Shield } from 'lucide-react';
import { useCommunities, CreateCommunityData } from '@/hooks/useCommunities';

interface CreateCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (community: any) => void;
}

export default function CreateCommunityModal({ isOpen, onClose, onSuccess }: CreateCommunityModalProps) {
  const { createCommunity, categories } = useCommunities();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateCommunityData>({
    nome: '',
    descricao: '',
    categoria: '',
    tipo: 'publica'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validações
      if (!formData.nome.trim()) {
        throw new Error('Nome da comunidade é obrigatório');
      }
      if (!formData.categoria) {
        throw new Error('Categoria é obrigatória');
      }
      if (formData.nome.length < 3) {
        throw new Error('Nome deve ter pelo menos 3 caracteres');
      }
      if (formData.nome.length > 100) {
        throw new Error('Nome deve ter no máximo 100 caracteres');
      }

      const community = await createCommunity(formData);
      
      onSuccess?.(community);
      onClose();
      
      // Reset form
      setFormData({
        nome: '',
        descricao: '',
        categoria: '',
        tipo: 'publica'
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar comunidade');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateCommunityData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const getTypeInfo = (tipo: string) => {
    const info = {
      publica: {
        icon: <Globe className="w-4 h-4" />,
        title: 'Pública',
        description: 'Qualquer pessoa pode ver e participar'
      },
      privada: {
        icon: <Lock className="w-4 h-4" />,
        title: 'Privada',
        description: 'Apenas membros podem ver o conteúdo'
      },
      restrita: {
        icon: <Shield className="w-4 h-4" />,
        title: 'Restrita',
        description: 'Precisa de aprovação para participar'
      }
    };
    return info[tipo as keyof typeof info];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Criar Nova Comunidade
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Nome da Comunidade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome da Comunidade *
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => handleInputChange('nome', e.target.value)}
              placeholder="Ex: Desenvolvedores React"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              maxLength={100}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.nome.length}/100 caracteres
            </p>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              value={formData.descricao}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              placeholder="Descreva o propósito e objetivos da sua comunidade..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.descricao.length}/500 caracteres
            </p>
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoria *
            </label>
            <select
              value={formData.categoria}
              onChange={(e) => handleInputChange('categoria', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            >
              <option value="">Selecione uma categoria</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de Comunidade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de Comunidade
            </label>
            <div className="space-y-3">
              {(['publica', 'privada', 'restrita'] as const).map(tipo => {
                const info = getTypeInfo(tipo);
                return (
                  <label
                    key={tipo}
                    className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.tipo === tipo
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="tipo"
                      value={tipo}
                      checked={formData.tipo === tipo}
                      onChange={(e) => handleInputChange('tipo', e.target.value)}
                      className="mt-1 mr-3"
                    />
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        {info.icon}
                        <span className="ml-2 font-medium text-gray-900">
                          {info.title}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {info.description}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Preview Simples */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preview
            </label>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Banner Padrão */}
              <div className="relative h-24 bg-gradient-to-r from-primary-500 to-secondary-500">
                {/* Avatar Padrão */}
                <div className="absolute -bottom-3 left-3">
                  <div className="w-8 h-8 bg-white rounded-full p-0.5 shadow-lg">
                    <div className="w-full h-full rounded-full bg-primary-100 flex items-center justify-center">
                      <Users className="w-4 h-4 text-primary-600" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-3 pt-5">
                <h4 className="font-medium text-gray-900">
                  {formData.nome || 'Nome da Comunidade'}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {formData.categoria || 'Categoria'} • {getTypeInfo(formData.tipo).title}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !formData.nome.trim() || !formData.categoria}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Criando...
                </div>
              ) : (
                'Criar Comunidade'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}