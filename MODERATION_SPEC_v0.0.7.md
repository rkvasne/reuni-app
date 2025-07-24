# 🛡️ Especificação v0.0.7 - Sistema de Moderação e Features Sociais

## 🎯 Objetivo

Implementar sistema completo de moderação para comunidades e adicionar funcionalidades sociais básicas (discussões, notificações).

## 🏗️ Funcionalidades Principais

### 1. **Sistema de Moderação Avançada**

#### 🎛️ Dashboard de Moderação
- **Rota**: `/communities/[id]/moderate`
- **Acesso**: Apenas admins e moderadores
- **Funcionalidades**:
  - Estatísticas da comunidade (membros, posts, eventos)
  - Lista de membros com ações em massa
  - Histórico de moderação
  - Configurações da comunidade

#### 🚫 Sistema de Punições
- **Banir Usuário**: Remover e impedir reentrada
- **Timeout**: Suspensão temporária (1h, 1d, 7d, 30d)
- **Warning**: Aviso formal registrado
- **Kick**: Remover sem banir (pode voltar)

#### 📋 Logs de Atividade
- **Auditoria**: Todas as ações de moderação registradas
- **Histórico**: Quem fez o quê e quando
- **Relatórios**: Resumos de atividade

### 2. **Features Sociais**

#### 💬 Discussões nas Comunidades
- **Posts**: Texto, imagem, link
- **Comentários**: Sistema aninhado (1 nível)
- **Reações**: Like, Love, Laugh, Angry
- **Moderação**: Deletar posts/comentários

#### 🔔 Sistema de Notificações
- **In-App**: Notificações dentro do aplicativo
- **Tipos**: Novo membro, novo post, menção, evento
- **Preferências**: Configurar quais receber

#### 🏷️ Menções e Tags
- **@usuário**: Mencionar usuários em posts/comentários
- **#hashtags**: Organizar conteúdo por temas
- **Notificações**: Avisar quando mencionado

## 🗄️ Estrutura do Banco de Dados

### Novas Tabelas

#### `posts_comunidade`
```sql
CREATE TABLE posts_comunidade (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comunidade_id UUID REFERENCES comunidades(id) ON DELETE CASCADE,
  autor_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  tipo VARCHAR(20) DEFAULT 'texto' CHECK (tipo IN ('texto', 'imagem', 'link')),
  imagem_url TEXT,
  link_url TEXT,
  fixado BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `comentarios_post`
```sql
CREATE TABLE comentarios_post (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts_comunidade(id) ON DELETE CASCADE,
  autor_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `reacoes_post`
```sql
CREATE TABLE reacoes_post (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts_comunidade(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('like', 'love', 'laugh', 'angry')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, usuario_id)
);
```

#### `notificacoes`
```sql
CREATE TABLE notificacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  conteudo TEXT,
  link_url TEXT,
  lida BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `logs_moderacao`
```sql
CREATE TABLE logs_moderacao (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comunidade_id UUID REFERENCES comunidades(id) ON DELETE CASCADE,
  moderador_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  usuario_alvo_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  acao VARCHAR(50) NOT NULL,
  motivo TEXT,
  duracao_horas INTEGER, -- Para timeouts
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `punicoes_usuario`
```sql
CREATE TABLE punicoes_usuario (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  comunidade_id UUID REFERENCES comunidades(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('ban', 'timeout', 'warning')),
  motivo TEXT,
  moderador_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  expira_em TIMESTAMP WITH TIME ZONE, -- NULL para bans permanentes
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🎨 Componentes a Implementar

### Moderação
- `ModerationDashboard.tsx` - Dashboard principal
- `MembersList.tsx` - Lista de membros com ações
- `ModerationActions.tsx` - Botões de ação (ban, timeout, etc.)
- `ModerationLogs.tsx` - Histórico de ações
- `PunishmentModal.tsx` - Modal para aplicar punições

### Social
- `CommunityFeed.tsx` - Feed de posts da comunidade
- `CreatePost.tsx` - Criar novo post
- `PostCard.tsx` - Card individual do post
- `CommentSection.tsx` - Seção de comentários
- `ReactionButton.tsx` - Botões de reação
- `NotificationCenter.tsx` - Central de notificações
- `NotificationItem.tsx` - Item individual de notificação

### Hooks
- `useModerationActions.ts` - Ações de moderação
- `useCommunityPosts.ts` - Posts da comunidade
- `useNotifications.ts` - Sistema de notificações
- `useReactions.ts` - Reações em posts

## 🔐 Políticas RLS

### Posts e Comentários
```sql
-- Ver posts de comunidades públicas ou onde é membro
CREATE POLICY "view_community_posts" ON posts_comunidade
FOR SELECT USING (
  comunidade_id IN (
    SELECT id FROM comunidades WHERE tipo = 'publica'
  ) OR
  comunidade_id IN (
    SELECT comunidade_id FROM membros_comunidade 
    WHERE usuario_id = auth.uid() AND status = 'ativo'
  )
);

-- Criar posts apenas em comunidades onde é membro
CREATE POLICY "create_posts" ON posts_comunidade
FOR INSERT WITH CHECK (
  autor_id = auth.uid() AND
  comunidade_id IN (
    SELECT comunidade_id FROM membros_comunidade 
    WHERE usuario_id = auth.uid() AND status = 'ativo'
  )
);
```

### Moderação
```sql
-- Apenas admins e moderadores podem ver logs
CREATE POLICY "view_moderation_logs" ON logs_moderacao
FOR SELECT USING (
  comunidade_id IN (
    SELECT comunidade_id FROM membros_comunidade 
    WHERE usuario_id = auth.uid() 
    AND papel IN ('admin', 'moderador') 
    AND status = 'ativo'
  )
);
```

## 🎯 Fluxos de Usuário

### Moderador
1. **Acessa Dashboard**: `/communities/[id]/moderate`
2. **Vê Estatísticas**: Membros, posts, atividade
3. **Modera Conteúdo**: Deleta posts inadequados
4. **Aplica Punições**: Ban, timeout, warning
5. **Revisa Logs**: Histórico de ações

### Membro da Comunidade
1. **Acessa Comunidade**: Vê feed de posts
2. **Cria Post**: Compartilha conteúdo
3. **Interage**: Comenta e reage
4. **Recebe Notificações**: Novos posts, menções
5. **Configura Preferências**: Tipos de notificação

## 📱 Interface e UX

### Dashboard de Moderação
- **Layout**: Sidebar com estatísticas + conteúdo principal
- **Ações Rápidas**: Botões para ações comuns
- **Filtros**: Por tipo de conteúdo, data, usuário
- **Bulk Actions**: Ações em massa

### Feed Social
- **Layout**: Similar ao MainFeed
- **Infinite Scroll**: Carregamento contínuo
- **Real-time**: Novos posts aparecem automaticamente
- **Interações**: Reações e comentários inline

### Notificações
- **Dropdown**: No header, similar ao menu do usuário
- **Badge**: Contador de não lidas
- **Agrupamento**: Por tipo e data
- **Ações**: Marcar como lida, ir para conteúdo

## 🚀 Implementação por Fases

### Fase 1: Estrutura Base (Semana 1)
- [ ] Criar migrações do banco
- [ ] Implementar hooks básicos
- [ ] Criar componentes de layout

### Fase 2: Sistema de Posts (Semana 2)
- [ ] Feed de posts da comunidade
- [ ] Criar e editar posts
- [ ] Sistema de comentários
- [ ] Reações básicas

### Fase 3: Moderação (Semana 3)
- [ ] Dashboard de moderação
- [ ] Sistema de punições
- [ ] Logs de atividade
- [ ] Ações em massa

### Fase 4: Notificações (Semana 4)
- [ ] Sistema de notificações in-app
- [ ] Preferências de notificação
- [ ] Notificações em tempo real
- [ ] Menções e tags

### Fase 5: Polimento (Semana 5-6)
- [ ] Testes e correções
- [ ] Otimizações de performance
- [ ] Melhorias de UX
- [ ] Documentação

## 📊 Métricas de Sucesso

### Engajamento
- **Posts por comunidade por dia**
- **Comentários por post**
- **Taxa de reação**
- **Tempo gasto no feed**

### Moderação
- **Ações de moderação por dia**
- **Tempo de resposta a reports**
- **Taxa de reincidência**
- **Satisfação dos membros**

### Notificações
- **Taxa de abertura**
- **Click-through rate**
- **Opt-out rate**
- **Engagement após notificação**

---

**Objetivo: Transformar comunidades estáticas em espaços sociais ativos com moderação eficiente!** 🚀