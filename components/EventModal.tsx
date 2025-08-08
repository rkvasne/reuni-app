'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Calendar, Clock, MapPin, Users, Image as ImageIcon, Tag } from 'lucide-react'
import Image from 'next/image'
import { useEvents, type Event, type CreateEventData } from '@/hooks/useEvents'
import ParticipantsList from './ParticipantsList'
import ImageUpload from './ImageUpload'

interface EventModalProps {
  isOpen: boolean
  onClose: () => void
  event?: Event | null // Para edição/visualização
  mode?: 'create' | 'edit' | 'view'
  onEventCreated?: () => void // Callback para atualizar lista após criar
  onEventUpdated?: () => void // Callback para atualizar lista após editar
}

const categorias = [
  'Arte',
  'Educação',
  'Entretenimento',
  'Esporte',
  'Gastronomia',
  'Música',
  'Negócios',
  'Outros',
  'Saúde',
  'Tecnologia'
]

export default function EventModal({ 
  isOpen, 
  onClose, 
  event, 
  mode = 'create',
  onEventCreated,
  onEventUpdated 
}: EventModalProps) {
  const { createEvent, updateEvent } = useEvents()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [formData, setFormData] = useState<CreateEventData>({
    titulo: '',
    local: '',
    data: '',
    hora: '',
    cidade: '',
    categoria: '',
    imagem_url: '',
    max_participantes: undefined
  })

  // Preencher formulário quando editando
  useEffect(() => {
    if (mode === 'edit' && event) {
      setFormData({
        titulo: event.titulo,
        local: event.local,
        data: event.data,
        hora: event.hora,
        cidade: event.cidade,
        categoria: event.categoria,
        imagem_url: event.imagem_url || '',
        max_participantes: event.max_participantes
      })
    } else if (mode === 'create') {
      // Reset form for create mode
      setFormData({
        titulo: '',
        local: '',
        data: '',
        hora: '',
        cidade: '',
        categoria: '',
        imagem_url: '',
        max_participantes: undefined
      })
    }
  }, [mode, event]) // depender do objeto para refletir mudanças de campos

  const handleClose = useCallback(() => {
    onClose()
    resetForm()
  }, [onClose])

  // Listener para tecla ESC
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleClose])

  // Click outside para fechar
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }, [handleClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validações básicas
      if (!formData.titulo.trim()) {
        throw new Error('Título é obrigatório')
      }
      if (!formData.data) {
        throw new Error('Data é obrigatória')
      }
      if (!formData.hora) {
        throw new Error('Hora é obrigatória')
      }
      if (!formData.local.trim()) {
        throw new Error('Local é obrigatório')
      }
      if (!formData.categoria) {
        throw new Error('Categoria é obrigatória')
      }

      // Validar data não pode ser no passado
      const eventDate = new Date(`${formData.data}T${formData.hora}`)
      const now = new Date()
      if (eventDate < now) {
        throw new Error('Data e hora do evento não podem ser no passado')
      }

      let result
      if (mode === 'edit' && event) {
        result = await updateEvent(event.id, formData)
        // Chamar callback de atualização
        if (result.data && onEventUpdated) {
          onEventUpdated()
        }
      } else {
        result = await createEvent(formData)
        // Chamar callback de criação
        if (result.data && onEventCreated) {
          onEventCreated()
        }
      }

      if (result.error) {
        throw new Error(result.error)
      }

      // Sucesso - fechar modal
      onClose()
      resetForm()
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar evento')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      titulo: '',
      local: '',
      data: '',
      hora: '',
      cidade: '',
      categoria: '',
      imagem_url: '',
      max_participantes: undefined
    })
    setError('')
  }

  if (!isOpen) return null

  // Função para formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long',
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5)
  }

  const getEventLocation = () => {
    if (!event) return '';
    
    if (event.local === 'Evento encontrado no eventbrite') {
      return event.cidade;
    }
    
    // Extrair local da descrição (formato: "Local - Cidade, Estado")
    if (event.local && event.local.includes(' - ')) {
      return event.local;
    }
    
    return event.local;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999]" onClick={handleBackdropClick}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="text-2xl font-bold text-neutral-800">
            {mode === 'view' ? event?.titulo : mode === 'edit' ? 'Editar Evento' : 'Criar Novo Evento'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-neutral-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-neutral-600" />
          </button>
        </div>

        {/* Conteúdo baseado no modo */}
        {mode === 'view' && event ? (
          /* Modo de Visualização */
          <div className="p-6 space-y-6">
            {/* Imagem do evento */}
              {event.imagem_url && (
                <div className="relative h-48 bg-neutral-200 rounded-xl overflow-hidden">
                  <Image
                    src={event.imagem_url}
                    alt={event.titulo}
                    fill
                    sizes="100vw"
                    className="object-cover"
                  />
                </div>
              )}

            {/* Informações básicas */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-lg text-sm font-medium">
                  {event.categoria}
                </span>
              </div>

              {event.local && (
                <div>
                  <h3 className="font-semibold text-neutral-800 mb-2">Local</h3>
                  <p className="text-neutral-600 leading-relaxed">{event.local}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-primary-500" />
                  <div>
                    <div className="font-medium text-neutral-800">{formatDate(event.data)}</div>
                    <div className="text-sm text-neutral-600">{formatTime(event.hora)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-primary-500" />
                  <div>
                    <div className="font-medium text-neutral-800">Local</div>
                    <div className="text-sm text-neutral-600">{getEventLocation()}</div>
                  </div>
                </div>
              </div>

              {/* Organizador */}
              <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                {event.organizador?.avatar_url ? (
                  <Image
                    src={event.organizador.avatar_url}
                    alt={event.organizador.nome}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">
                      {event.organizador?.nome?.charAt(0) || 'U'}
                    </span>
                  </div>
                )}
                <div>
                  <div className="font-medium text-neutral-800">Organizador</div>
                  <div className="text-sm text-neutral-600">{event.organizador?.nome || 'Organizador'}</div>
                </div>
              </div>
            </div>

            {/* Lista de Participantes */}
            <div className="border-t border-neutral-200 pt-6">
              <ParticipantsList eventId={event.id} />
            </div>

            {/* Botão de fechar */}
            <div className="pt-4">
              <button
                onClick={handleClose}
                className="w-full px-6 py-3 border border-neutral-300 text-neutral-700 rounded-xl hover:bg-neutral-50 transition-all font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        ) : (
          /* Modo de Criação/Edição - Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Erro */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Título do Evento *
            </label>
            <input
              type="text"
              value={formData.titulo}
              onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
              className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="Ex: Meetup de Tecnologia"
              required
            />
          </div>

          {/* Local */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Local
            </label>
            <textarea
              value={formData.local}
              onChange={(e) => setFormData(prev => ({ ...prev, local: e.target.value }))}
              rows={4}
              className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
              placeholder="Descreva o local do evento..."
            />
          </div>

          {/* Data e Hora */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Data *
              </label>
              <input
                type="date"
                value={formData.data}
                onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Hora *
              </label>
              <input
                type="time"
                value={formData.hora}
                onChange={(e) => setFormData(prev => ({ ...prev, hora: e.target.value }))}
                className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          {/* Cidade */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Cidade *
            </label>
            <input
              type="text"
              value={formData.cidade}
              onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
              className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="Ex: São Paulo, SP"
              required
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              <Tag className="w-4 h-4 inline mr-1" />
              Categoria *
            </label>
            <select
              value={formData.categoria}
              onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value }))}
              className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              required
            >
              <option value="">Selecione uma categoria</option>
              {categorias.map(categoria => (
                <option key={categoria} value={categoria}>
                  {categoria}
                </option>
              ))}
            </select>
          </div>

          {/* Upload de Imagem */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              <ImageIcon className="w-4 h-4 inline mr-1" />
              Imagem do Evento
            </label>
            <ImageUpload
              value={formData.imagem_url}
              onChange={(url) => setFormData(prev => ({ ...prev, imagem_url: url }))}
              onRemove={() => setFormData(prev => ({ ...prev, imagem_url: '' }))}
              bucket="events"
              folder="images"
              placeholder="Clique para fazer upload ou arraste uma imagem do evento"
            />
          </div>

          {/* Máximo de Participantes */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              <Users className="w-4 h-4 inline mr-1" />
              Máximo de Participantes
            </label>
            <input
              type="number"
              min="1"
              value={formData.max_participantes || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                max_participantes: e.target.value ? parseInt(e.target.value) : undefined 
              }))}
              className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="Deixe vazio para ilimitado"
            />
          </div>

          {/* Botões */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-6 py-3 border border-neutral-300 text-neutral-700 rounded-xl hover:bg-neutral-50 transition-all font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : (mode === 'edit' ? 'Atualizar' : 'Criar Evento')}
            </button>
          </div>

          </form>
        )}
      </div>
    </div>
  )
}