# 🗄️ Configuração do Supabase

## 1. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Clique em "New Project"
3. Escolha um nome e senha para o banco
4. Aguarde a criação (2-3 minutos)

## 2. Obter credenciais

No dashboard do projeto:
- Vá em Settings > API
- Copie a `URL` e `anon public key`
- Cole no arquivo `.env.local`

## 3. Executar Migrações

### Opção 1: Migração Completa (Recomendado)
```sql
-- Execute em ordem no SQL Editor do Supabase:
\i supabase/migrations/001_initial_communities_migration.sql
\i supabase/migrations/002_rls_policies_setup.sql
\i supabase/migrations/003_triggers_and_functions.sql
```

### Opção 2: Migração Mínima
```sql
-- Se a migração completa falhar:
\i supabase/migrations/006_minimal_migration.sql
```

### Opção 3: Criação Manual das Tabelas

Se preferir criar manualmente, execute:

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
  avatar_url TEXT,
  banner_url TEXT,
  categoria VARCHAR(50) NOT NULL DEFAULT 'Outros',
  tipo VARCHAR(20) DEFAULT 'publica' CHECK (tipo IN ('publica', 'privada', 'restrita')),
  criador_id UUID REFERENCES usuarios(id),
  membros_count INTEGER DEFAULT 0,
  eventos_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de membros de comunidades
CREATE TABLE membros_comunidade (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comunidade_id UUID REFERENCES comunidades(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  papel VARCHAR(20) DEFAULT 'membro' CHECK (papel IN ('admin', 'moderador', 'membro')),
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'pendente', 'banido')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comunidade_id, usuario_id)
);

-- Tabela de comentários
CREATE TABLE comentarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar referência de comunidade em eventos
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS comunidade_id UUID REFERENCES comunidades(id);
```

## 4. Configurar Row Level Security (RLS)

### Opção 1: Políticas Simples (Recomendado)
```sql
-- Habilitar RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE presencas ENABLE ROW LEVEL SECURITY;
ALTER TABLE comunidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE membros_comunidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentarios ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (sem recursão)
CREATE POLICY "view_users" ON usuarios FOR SELECT USING (true);
CREATE POLICY "update_own_user" ON usuarios FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "view_events" ON eventos FOR SELECT USING (true);
CREATE POLICY "create_events" ON eventos FOR INSERT WITH CHECK (auth.uid() = organizador_id);
CREATE POLICY "update_own_events" ON eventos FOR UPDATE USING (auth.uid() = organizador_id);

CREATE POLICY "view_communities" ON comunidades FOR SELECT USING (tipo = 'publica' OR criador_id = auth.uid());
CREATE POLICY "create_communities" ON comunidades FOR INSERT WITH CHECK (auth.uid() = criador_id);
CREATE POLICY "update_own_communities" ON comunidades FOR UPDATE USING (criador_id = auth.uid());

CREATE POLICY "view_members" ON membros_comunidade FOR SELECT USING (usuario_id = auth.uid());
CREATE POLICY "join_communities" ON membros_comunidade FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "leave_communities" ON membros_comunidade FOR DELETE USING (usuario_id = auth.uid());

CREATE POLICY "view_presences" ON presencas FOR SELECT USING (true);
CREATE POLICY "manage_own_presence" ON presencas FOR ALL USING (auth.uid() = usuario_id);

CREATE POLICY "view_comments" ON comentarios FOR SELECT USING (true);
CREATE POLICY "create_comments" ON comentarios FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "update_own_comments" ON comentarios FOR UPDATE USING (auth.uid() = usuario_id);
```

### Opção 2: Desabilitar RLS (Desenvolvimento)
```sql
-- APENAS PARA DESENVOLVIMENTO - NÃO USE EM PRODUÇÃO
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE eventos DISABLE ROW LEVEL SECURITY;
ALTER TABLE presencas DISABLE ROW LEVEL SECURITY;
ALTER TABLE comunidades DISABLE ROW LEVEL SECURITY;
ALTER TABLE membros_comunidade DISABLE ROW LEVEL SECURITY;
ALTER TABLE comentarios DISABLE ROW LEVEL SECURITY;
```

## 5. Configurar Google OAuth

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

## 6. Configurar Storage (opcional)

Para upload de imagens:

1. Vá em Storage no dashboard
2. Crie um bucket chamado "event-images"
3. Configure as políticas de acesso conforme necessário

## 7. Configurar Email Templates

Para personalizar emails de confirmação:

1. Vá em Authentication > Email Templates
2. Selecione "Confirm signup"
3. Personalize o template conforme necessário
4. Veja o [guia completo de email setup](./EMAIL_SETUP.md)

## 🔧 Verificação da Instalação

Execute para verificar se tudo está funcionando:

```sql
-- Verificar estrutura das tabelas
\i supabase/migrations/009_safe_test.sql

-- Verificação rápida
\i supabase/migrations/010_quick_check.sql
```

## ⚠️ Problemas Comuns

### Erro de Recursão RLS
Se encontrar erro "infinite recursion detected":
```sql
\i supabase/migrations/004_fix_rls_recursion.sql
```

### Comunidades sem admin
Se comunidades não têm administradores:
```sql
\i supabase/migrations/011_fix_admins.sql
```

### Contadores incorretos
Se contadores de membros/eventos estão errados:
```sql
\i supabase/migrations/003_triggers_and_functions.sql
```

## 📚 Documentação Adicional

- **[Migrações Completas](../../supabase/migrations/README.md)** - Guia detalhado das migrações
- **[Problemas RLS](../fixes/RLS_ISSUES.md)** - Soluções para Row Level Security
- **[Email Setup](./EMAIL_SETUP.md)** - Configuração de templates de email

## 🆘 Suporte

Se encontrar problemas:

1. Verifique se todas as migrações foram executadas
2. Confirme se as variáveis de ambiente estão corretas
3. Execute os scripts de verificação
4. Consulte a seção de [correções](../fixes/)
5. Verifique os logs do Supabase

---

**Configuração completa do Supabase para o Reuni!** 🚀