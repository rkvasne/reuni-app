'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Calendar, Users, Search, Sparkles } from 'lucide-react'

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-primary-100 to-secondary-100 rounded-lg mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-lg text-neutral-800 mb-2">{title}</h3>
      <p className="text-neutral-600 text-sm leading-relaxed">{description}</p>
    </div>
  )
}

export default function WelcomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Se não estiver logado, redirecionar para home
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Será redirecionado pelo useEffect
  }

  // Extrair nome do email (parte antes do @)
  const userName = user.email?.split('@')[0] || 'usuário'
  const displayName = userName.charAt(0).toUpperCase() + userName.slice(1)

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          
          {/* Header de Boas-vindas */}
          <div className="text-center mb-16">
            <div className="w-24 h-24 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-neutral-800 mb-6">
              Bem-vindo ao Reuni, {displayName}! 🎉
            </h1>
            
            <p className="text-xl text-neutral-600 leading-relaxed max-w-2xl mx-auto">
              Você agora faz parte de uma comunidade que conecta pessoas 
              através de eventos incríveis. Vamos começar sua jornada de descobertas!
            </p>
          </div>

          {/* Cards de Funcionalidades */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <FeatureCard 
              icon={<Search className="w-6 h-6 text-primary-600" />}
              title="Descubra Eventos"
              description="Encontre eventos que combinam perfeitamente com seus interesses e hobbies na sua região."
            />
            <FeatureCard 
              icon={<Users className="w-6 h-6 text-secondary-600" />}
              title="Conecte-se"
              description="Conheça pessoas incríveis com interesses similares e construa novas amizades."
            />
            <FeatureCard 
              icon={<Calendar className="w-6 h-6 text-accent-600" />}
              title="Organize Eventos"
              description="Crie seus próprios eventos e ajude a construir uma comunidade mais conectada."
            />
          </div>

          {/* Seção de Próximos Passos */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-neutral-200 mb-12">
            <h2 className="text-2xl font-bold text-neutral-800 mb-6 text-center">
              Como começar no Reuni
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-800 mb-1">Explore o Feed</h3>
                    <p className="text-neutral-600 text-sm">Navegue pelos eventos disponíveis e encontre algo que desperte seu interesse.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-secondary-100 text-secondary-600 rounded-full flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-800 mb-1">Participe de Eventos</h3>
                    <p className="text-neutral-600 text-sm">Clique em "Eu Vou!" nos eventos que te interessam e confirme sua presença.</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-accent-100 text-accent-600 rounded-full flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-800 mb-1">Conheça Pessoas</h3>
                    <p className="text-neutral-600 text-sm">Veja quem mais vai participar e comece a fazer conexões antes mesmo do evento.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-bold text-sm">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-800 mb-1">Crie Seus Eventos</h3>
                    <p className="text-neutral-600 text-sm">Quando se sentir à vontade, organize seus próprios eventos e convide a comunidade.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <button 
              onClick={() => router.push('/')}
              className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Explorar Eventos Agora
            </button>
            
            <p className="text-neutral-500 text-sm mt-4">
              Pronto para descobrir eventos incríveis? Vamos lá! 🚀
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}