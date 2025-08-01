# 🚀 Configuração do Projeto

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no [Supabase](https://supabase.com)
- Git instalado

## 🛠️ Configuração Local

### 1. Clone e instale dependências

```bash
git clone https://github.com/seuusuario/reuni.git
cd reuni
npm install
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite o arquivo `.env.local` com suas credenciais do Supabase.

### 3. Execute o projeto

```bash
npm run dev
```

O projeto estará disponível em `http://localhost:3000`

## 🎨 Estrutura do Projeto

```
/reuni
├── /app                 # Next.js App Router
│   ├── globals.css      # Estilos globais
│   ├── layout.tsx       # Layout principal
│   └── page.tsx         # Página inicial (landing + app integrados)
├── /components          # Componentes React
│   ├── Header.tsx       # Cabeçalho com menu do usuário
│   ├── LeftSidebar.tsx  # Sidebar esquerda
│   ├── MainFeed.tsx     # Feed central
│   ├── RightSidebar.tsx # Sidebar direita
│   ├── EventCard.tsx    # Card de evento
│   ├── FeaturedCarousel.tsx # Carrossel
│   ├── LandingPage.tsx  # Landing page
│   └── AuthModal.tsx    # Modal de autenticação
├── /hooks               # React Hooks
│   └── useAuth.ts       # Hook de autenticação
├── /lib                 # Utilitários
│   └── supabase.ts      # Cliente Supabase
├── /docs                # Documentação
│   ├── /features        # Documentação de funcionalidades
│   ├── /setup           # Guias de configuração
│   ├── /fixes           # Correções e soluções
│   └── /releases        # Notas de versão
├── /supabase/migrations # Migrações SQL organizadas
└── ...configs           # Arquivos de configuração
```

## 🚀 Deploy

### Vercel (Recomendado)

1. Conecte seu repositório no [Vercel](https://vercel.com)
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### Outras opções

- Netlify
- Railway
- Heroku

## 🔐 Funcionalidades de Autenticação

### Login com Google
- ✅ **Configurado**: Botão "Continuar com Google" no modal de login
- ✅ **Redirect**: Página de callback em `/auth/callback`
- ⚠️ **Requer**: Configuração do Google OAuth no Supabase

### Cadastro Apenas com Email
- ✅ **Magic Link**: Cadastro sem senha usando link mágico
- ✅ **Simplificado**: Apenas nome e email necessários
- ✅ **Seguro**: Link enviado por email para confirmação

### Login Tradicional
- ✅ **Email/Senha**: Para usuários que preferem senha
- ✅ **Validação**: Campos obrigatórios e feedback visual
- ✅ **Segurança**: Senhas com mínimo de 6 caracteres

## 📝 Próximos Passos

1. ✅ **CRUD completo de eventos** - Implementado
2. ✅ **Sistema de participação ("Eu Vou")** - Implementado
3. ✅ **Sistema de comunidades** - Implementado
4. ✅ **Sistema de busca avançada** - Implementado
5. ✅ **Sistema de perfil** - Implementado
6. 🔄 **PWA features (offline, install prompt)** - Planejado
7. 🔄 **Notificações web push** - Planejado
8. 🔄 **Apps nativos (React Native)** - Futuro

## 🆘 Suporte

Se encontrar problemas:

1. Verifique se todas as dependências estão instaladas
2. Confirme se as variáveis de ambiente estão corretas
3. Verifique se as tabelas do Supabase foram criadas
4. Consulte a [documentação completa](../README.md)
5. Verifique os [problemas comuns](../fixes/)

## 📚 Documentação Adicional

- **[Configuração Supabase](./SUPABASE_SETUP.md)** - Setup completo do banco de dados
- **[Migrações](../../supabase/migrations/README.md)** - Scripts SQL organizados
- **[Funcionalidades](../features/)** - Documentação detalhada das features
- **[Correções](../fixes/)** - Soluções para problemas comuns

---

**Desenvolvido com ❤️ para conectar pessoas através de eventos reais.**