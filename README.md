# 🌐 Reuni - Rede Social de Eventos

> Conecte-se através de eventos reais. Uma plataforma moderna que une pessoas através de experiências autênticas.

**Status:** 🚧 Em desenvolvimento ativo  
**Última atualização:** 21 de Julho de 2025

---

## 🎯 O que é o Reuni?

Reuni é uma rede social focada em eventos reais onde você pode:
- **Descobrir** eventos próximos baseados nos seus interesses
- **Criar** e promover seus próprios eventos facilmente  
- **Participar** de comunidades temáticas
- **Conectar-se** com pessoas que compartilham suas paixões

---

## ✨ Status Atual

### ✅ Implementado
- Sistema de autenticação completo (email/senha + Google OAuth)
- Interface integrada (landing page + aplicação principal)
- Layout responsivo de 3 colunas
- Componentes principais do feed de eventos
- Identidade visual única e moderna

### 🔄 Em Desenvolvimento
- Sistema completo de eventos (CRUD)
- Sistema de participação ("Eu Vou")
- Busca e filtros avançados

### 📋 Próximos Passos
- Sistema de comunidades
- Notificações em tempo real (web push)
- PWA features (offline, install prompt)
- Apps nativos Android/iOS (React Native)

---

## 🚀 Tecnologias

**Web App (Fase 1):**
- Frontend: Next.js 14, React 18, TypeScript, Tailwind CSS
- Backend: Supabase (PostgreSQL, Auth, Storage, Real-time)
- Deploy: Vercel
- PWA: Service Workers, Web Push, Offline Support

**Apps Nativos (Fase 2):**
- React Native para Android e iOS
- Código compartilhado com web app
- Features nativas: câmera, GPS, push notifications

---

## 🏃‍♂️ Como Executar

```bash
# 1. Clone e instale
git clone https://github.com/seuusuario/reuni.git
cd reuni
npm install

# 2. Configure o Supabase
cp .env.example .env.local
# Adicione suas credenciais do Supabase

# 3. Execute
npm run dev
```

**Acesse:** http://localhost:3000
- Visitantes verão a landing page
- Usuários logados verão o app principal

> 📖 **Configuração completa:** Veja [SETUP.md](./SETUP.md) para instruções detalhadas do Supabase

---

## 📚 Documentação

- **[PRD.md](./PRD.md)** - Product Requirements Document completo
- **[SETUP.md](./SETUP.md)** - Guia de configuração técnica
- **[STATUS.md](./STATUS.md)** - Status detalhado do desenvolvimento
- **[Specs](./.kiro/specs/reuni-social-platform/)** - Especificações técnicas detalhadas

---

## 🎨 Identidade Visual

**Cores principais:**
- Azul vibrante (#2563EB) - Primária
- Rosa nostálgico (#EC4899) - Secundária  
- Verde limão (#10B981) - Destaque

**Design:** Moderno com elementos nostálgicos, mobile-first, gradientes únicos

---

## 🤝 Contribuição

Este é um projeto em desenvolvimento ativo. Para contribuir:

1. Leia a documentação técnica em [SETUP.md](./SETUP.md)
2. Verifique o status atual em [STATUS.md](./STATUS.md)
3. Consulte os requisitos em [PRD.md](./PRD.md)

---

## 👨‍💻 Autor

**Raphael Kvasne**  
CEO & Fundador da Evoinfo  
🚀 Construindo o futuro das conexões reais através da tecnologia

---

## 📄 Licença

MIT License - Sinta-se livre para colaborar, adaptar ou expandir.