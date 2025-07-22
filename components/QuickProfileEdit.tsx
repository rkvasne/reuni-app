'use client'

import { useState } from 'react'
import { Edit3, Save, X } from 'lucide-react'
import { useUserProfile } from '@/hooks/useUserProfile'

interface QuickProfileEditProps {
  field: 'nome' | 'bio'
  value: string
  placeholder?: string
  multiline?: boolean
}

export default function QuickProfileEdit({ 
  field, 
  value, 
  placeholder = '', 
  multiline = false 
}: QuickProfileEditProps) {
  const { updateProfile } = useUserProfile()
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (editValue.trim() === value) {
      setIsEditing(false)
      return
    }

    setLoading(true)
    try {
      const result = await updateProfile({ [field]: editValue.trim() })
      if (result.error) {
        throw new Error(result.error)
      }
      setIsEditing(false)
    } catch (error) {
      console.error('Erro ao atualizar:', error)
      setEditValue(value) // Reverter valor
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setEditValue(value)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="flex items-start gap-2">
        {multiline ? (
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            rows={3}
            placeholder={placeholder}
            autoFocus
          />
        ) : (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={placeholder}
            autoFocus
          />
        )}
        <div className="flex gap-1">
          <button
            onClick={handleSave}
            disabled={loading}
            className="p-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="p-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="group flex items-start gap-2">
      <div className="flex-1">
        {value ? (
          <span className={multiline ? 'whitespace-pre-wrap' : ''}>
            {value}
          </span>
        ) : (
          <span className="text-neutral-500 italic">
            {placeholder}
          </span>
        )}
      </div>
      <button
        onClick={() => setIsEditing(true)}
        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-neutral-100 rounded transition-all"
      >
        <Edit3 className="w-4 h-4 text-neutral-500" />
      </button>
    </div>
  )
}