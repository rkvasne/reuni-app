'use client'

import { useState } from 'react'
import { Calendar, Users, User } from 'lucide-react'
import AuthModal from './AuthModal'

export default function LandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')

  const handleLogin = () => {
    setAuthMode('login')
    setShowAuthModal(true)
  }

  const handleSignup = () => {
    setAuthMode('signup')
    setShowAuthModal(true)
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      
      {/* Header */}
      <header className="w-full px-6 py-4 flex justify-between items-center bg-white shadow-sm fixed top-0 z-50 border-b border-neutral-200">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
          Reuni
        </h1>
        <nav className="space-x-4 hidden md:flex">
          <a href="#sobre" className="text-neutral-600 hover:text-primary-600 transition-colors">Sobre</a>
          <a href="#funcionalidades" className="text-neutral-600 hover:text-primary-600 transition-colors">Funcionalidades</a>
          <a href="#comunidade" className="text-neutral-600 hover:text-primary-600 transition-colors">Comunidade</a>
        </nav>
        <button 
          onClick={handleLogin}
          className="btn-primary"
        >
          Entrar
        </button>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 text-center bg-gradient-to-br from-primary-50 to-secondary-50">
        <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
          Conecte-se através de eventos reais
        </h2>
        <p className="text-lg md:text-xl text-neutral-700 mb-8 max-w-2xl mx-auto leading-relaxed">
          Descubra, participe e crie eventos incríveis. Reuni é onde conexões autênticas acontecem.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={handleSignup}
            className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white px-8 py-3 rounded-xl text-lg transition-all font-medium shadow-reuni-lg"
          >
            Começar agora
          </button>
          <a 
            href="#sobre"
            className="bg-white text-primary-600 px-8 py-3 rounded-xl text-lg hover:bg-neutral-50 transition-all font-medium border border-primary-200"
          >
            Saiba mais
          </a>
        </div>
      </section>

      {/* Sobre */}
      <section id="sobre" className="py-20 px-6 max-w-5xl mx-auto text-center">
        <h3 className="text-3xl font-bold text-neutral-800 mb-6">O que é o Reuni?</h3>
        <p className="text-neutral-600 text-lg leading-relaxed">
          Reuni é uma plataforma social onde eventos são o centro da experiência.
          Encontre shows, cursos, pedaladas, encontros, cultos e tudo que faz a vida acontecer.
          Confirme presença, interaja com pessoas reais, construa conexões autênticas.
        </p>
      </section>

      {/* Funcionalidades */}
      <section id="funcionalidades" className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-center text-neutral-800 mb-12">Como funciona o Reuni</h3>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            
            <div className="p-6 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 hover:shadow-reuni-lg transition-all">
              <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-xl font-semibold mb-3 text-primary-700">Feed de Eventos</h4>
              <p className="text-neutral-600">Descubra eventos perto de você com base em seus interesses e comunidades.</p>
            </div>
            
            <div className="p-6 rounded-xl bg-gradient-to-br from-secondary-50 to-secondary-100 hover:shadow-reuni-lg transition-all">
              <div className="w-12 h-12 bg-secondary-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-xl font-semibold mb-3 text-secondary-700">Comunidades</h4>
              <p className="text-neutral-600">Participe de grupos temáticos e conecte-se com pessoas que compartilham seus interesses.</p>
            </div>
            
            <div className="p-6 rounded-xl bg-gradient-to-br from-accent-50 to-accent-100 hover:shadow-reuni-lg transition-all">
              <div className="w-12 h-12 bg-accent-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <User className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-xl font-semibold mb-3 text-accent-700">Perfil Social</h4>
              <p className="text-neutral-600">Construa seu perfil baseado nas experiências que você vive e compartilha.</p>
            </div>
            
          </div>
        </div>
      </section>

      {/* Comunidade */}
      <section id="comunidade" className="py-20 px-6 text-center max-w-4xl mx-auto bg-neutral-50">
        <h3 className="text-3xl font-bold text-neutral-800 mb-6">Uma comunidade feita para quem vive de verdade</h3>
        <p className="text-neutral-600 text-lg mb-8 leading-relaxed">
          Seja para encontrar sua próxima aventura ou reviver as melhores memórias, o Reuni conecta você a tudo o que realmente importa.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={handleSignup}
            className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white px-8 py-3 rounded-xl transition-all font-medium shadow-reuni-lg"
          >
            Crie sua conta grátis
          </button>
          <button 
            onClick={handleLogin}
            className="bg-white text-neutral-700 px-8 py-3 rounded-xl hover:bg-neutral-100 transition-all font-medium border border-neutral-200"
          >
            Ver demonstração
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 py-8 text-center text-sm text-neutral-600">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
                Reuni
              </span>
              <span>© 2025 Todos os direitos reservados.</span>
            </div>
            <div className="flex gap-6">
              <a href="#" className="text-neutral-600 hover:text-primary-600 transition-colors">Política de Privacidade</a>
              <a href="#" className="text-neutral-600 hover:text-primary-600 transition-colors">Termos de Uso</a>
              <a href="#" className="text-neutral-600 hover:text-primary-600 transition-colors">Contato</a>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Modal de Autenticação */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
      
    </div>
  )
}