

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

## 🗄️ Configuração do Supabase

### 1. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Clique em "New Project"
3. Escolha um nome e senha para o banco
4. Aguarde a criação (2-3 minutos)

### 2. Obter credenciais

No dashboard do projeto:
- Vá em Settings > API
- Copie a `URL` e `anon public key`
- Cole no arquivo `.env.local`

### 3. Criar tabelas do banco

Execute os seguintes comandos SQL no editor do Supabase:

```sql
-- Tabela de usuários
CREATE TABLE usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  avatar TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de eventos
CREATE TABLE eventos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  descricao TEXT,
  data DATE NOT NULL,
  hora TIME NOT NULL,
  local VARCHAR(300) NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  imagem_url TEXT,
  organizador_id UUID REFERENCES usuarios(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de presenças
CREATE TABLE presencas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'confirmado' CHECK (status IN ('confirmado', 'interessado', 'cancelado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(evento_id, usuario_id)
);

-- Tabela de comunidades
CREATE TABLE comunidades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(50) NOT NULL,
  criador_id UUID REFERENCES usuarios(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de comentários
CREATE TABLE comentarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de membros de comunidades
CREATE TABLE membros_comunidade (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comunidade_id UUID REFERENCES comunidades(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comunidade_id, usuario_id)
);
```

### 4. Configurar Row Level Security (RLS)

```sql
-- Habilitar RLS nas tabelas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE presencas ENABLE ROW LEVEL SECURITY;
ALTER TABLE comunidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE membros_comunidade ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (ajuste conforme necessário)
CREATE POLICY "Usuários podem ver todos os perfis" ON usuarios FOR SELECT USING (true);
CREATE POLICY "Usuários podem atualizar próprio perfil" ON usuarios FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Todos podem ver eventos" ON eventos FOR SELECT USING (true);
CREATE POLICY "Usuários podem criar eventos" ON eventos FOR INSERT WITH CHECK (auth.uid() = organizador_id);
CREATE POLICY "Organizadores podem editar eventos" ON eventos FOR UPDATE USING (auth.uid() = organizador_id);

CREATE POLICY "Todos podem ver presenças" ON presencas FOR SELECT USING (true);
CREATE POLICY "Usuários podem gerenciar próprias presenças" ON presencas FOR ALL USING (auth.uid() = usuario_id);

CREATE POLICY "Todos podem ver comunidades" ON comunidades FOR SELECT USING (true);
CREATE POLICY "Usuários podem criar comunidades" ON comunidades FOR INSERT WITH CHECK (auth.uid() = criador_id);

CREATE POLICY "Todos podem ver comentários" ON comentarios FOR SELECT USING (true);
CREATE POLICY "Usuários podem criar comentários" ON comentarios FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Usuários podem editar próprios comentários" ON comentarios FOR UPDATE USING (auth.uid() = usuario_id);
```

### 5. Configurar Google OAuth

Para habilitar login com Google:

1. **Criar projeto no Google Cloud Console**
   - Acesse [Google Cloud Console](https://console.cloud.google.com)
   - Crie um novo projeto ou selecione um existente
   - Ative a API "Google+ API" ou "Google Identity"

2. **Configurar OAuth 2.0**
   - Vá em "APIs & Services" > "Credentials"
   - Clique em "Create Credentials" > "OAuth 2.0 Client IDs"
   - Tipo de aplicação: "Web application"
   - Nome: "Reuni App"
   - Authorized redirect URIs: `https://seu-projeto.supabase.co/auth/v1/callback`

3. **Configurar no Supabase**
   - No dashboard do Supabase, vá em "Authentication" > "Providers"
   - Habilite "Google"
   - Cole o "Client ID" e "Client Secret" do Google
   - Salve as configurações

### 6. Configurar Storage (opcional)

Para upload de imagens:

1. Vá em Storage no dashboard
2. Crie um bucket chamado "event-images"
3. Configure as políticas de acesso conforme necessário

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
├── /.kiro/specs         # Especificações técnicas
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

## � PFuncionalidades de Autenticação

### Login com Google
- ✅ **Configurado**: Botão "Continuar com Google" no modal de login
- ✅ **Redirect**: Página de callback em `/auth/callback`
- ⚠️ **Requer**: Configuração do Google OAuth no Supabase (ver seção 5)

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
2. **Sistema de participação ("Eu Vou")** - Próximo
3. **Sistema de comunidades** - Planejado
4. **PWA features (offline, install prompt)** - Planejado
5. **Notificações web push** - Planejado
6. **Apps nativos (React Native)** - Futuro

## 🆘 Suporte

Se encontrar problemas:

1. Verifique se todas as dependências estão instaladas
2. Confirme se as variáveis de ambiente estão corretas
3. Verifique se as tabelas do Supabase foram criadas
4. Consulte a documentação do [Next.js](https://nextjs.org/docs) e [Supabase](https://supabase.com/docs)

---

**Desenvolvido com ❤️ para conectar pessoas através de eventos reais.**