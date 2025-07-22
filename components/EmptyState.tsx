'use client'

import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="card p-8 text-center">
      <Icon className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-neutral-800 mb-2">
        {title}
      </h3>
      <p className="text-neutral-600 mb-4">
        {description}
      </p>
      {action && (
        <button onClick={action.onClick} className="btn-primary">
          {action.label}
        </button>
      )}
    </div>
  )
}