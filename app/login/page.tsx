'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AuthModal from '@/components/AuthModal'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(true)

  const redirectedFrom = useMemo(() => {
    const value = searchParams.get('redirectedFrom')
    if (value && value.startsWith('/') && !value.startsWith('//')) return value
    return '/'
  }, [searchParams])

  useEffect(() => {
    if (!isOpen) {
      router.replace(redirectedFrom)
    }
  }, [isOpen, redirectedFrom, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <AuthModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialMode="login"
      />
    </div>
  )
}


