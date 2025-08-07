'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { markWelcomeSeen } from '@/utils/onboardingUtils'

interface FeatureCardProps {
  icon: string
  title: string
  description: string
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => (
  <div className="bg-white rounded-xl p-4 md:p-6 shadow-lg border border-neutral-100 hover:shadow-xl transition-all duration-300 h-full">
    <div className="text-3xl md:text-4xl mb-3 md:mb-4 text-center">{icon}</div>
    <h3 className="text-base md:text-lg font-semibold text-neutral-800 mb-2 text-center">
      {title}
    </h3>
    <p className="text-sm md:text-base text-neutral-600 text-center leading-relaxed">
      {description}
    </p>
  </div>
)

const WelcomePage = () => {
  const { user } = useAuth()
  const router = useRouter()

  const handleExploreEvents = () => {
    // Marcar que o usuário completou o onboarding
    if (user?.id) {
      markWelcomeSeen(user.id)
    }
    router.push('/')
  }

  // Extrai o nome do usuário do email (parte antes do @)
  const userName = user?.email?.split('@')[0] || 'usuário'

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12 md:mb-16">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl md:text-3xl">🎉</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-800 mb-4 md:mb-6 px-4">
              Bem-vindo ao Reuni, {userName}!
            </h1>
            
            <p className="text-lg md:text-xl text-neutral-600 leading-relaxed max-w-2xl mx-auto px-4">
              Você agora faz parte de uma comunidade que conecta pessoas 
              através de eventos incríveis. Vamos começar sua jornada!
            </p>
          </div>
          
          {/* Feature Cards */}
          <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-16 px-4 md:px-0">
            <FeatureCard 
              icon="🔍"
              title="Descubra Eventos"
              description="Encontre eventos que combinam com seus interesses e descubra novas experiências na sua região"
            />
            <FeatureCard 
              icon="👥"
              title="Conecte-se"
              description="Conheça pessoas com interesses similares e construa conexões significativas"
            />
            <FeatureCard 
              icon="📅"
              title="Organize"
              description="Crie seus próprios eventos e construa uma comunidade ao seu redor"
            />
          </div>
          
          {/* Call to Action */}
          <div className="text-center px-4">
            <button 
              onClick={handleExploreEvents}
              className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold text-base md:text-lg px-6 md:px-8 py-3 md:py-4 rounded-xl hover:from-primary-600 hover:to-secondary-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 w-full sm:w-auto"
            >
              Explorar Eventos
            </button>
            
            <p className="text-neutral-500 text-sm mt-4">
              Comece descobrindo eventos incríveis na sua região
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WelcomePage