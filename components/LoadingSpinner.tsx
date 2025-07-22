'use client'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

export default function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className={`${sizeClasses[size]} border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mb-4`}></div>
      {text && (
        <p className="text-neutral-600 text-sm">{text}</p>
      )}
    </div>
  )
}