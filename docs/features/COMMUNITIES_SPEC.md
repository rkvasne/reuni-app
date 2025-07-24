# 🏘️ Sistema de Comunidades - Especificação v0.0.5

## 📋 Visão Geral

O Sistema de Comunidades permite que usuários criem e participem de grupos temáticos, organizem eventos específicos e construam redes sociais em torno de interesses comuns.

## 🎯 Objetivos

- **Organização Temática:** Agrupar eventos por interesses/temas
- **Gestão de Membros:** Sistema de moderação e permissões
- **Engajamento:** Discussões e interações dentro das comunidades
- **Descoberta:** Facilitar encontrar comunidades relevantes

## 🏗️ Estrutura de Dados

### Tabela: `comunidades`
```sql
CREATE TABLE comunidades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  categoria VARCHAR(50),
  tipo VARCHAR(20) DEFAULT 'publica', -- publica, privada, restrita
  criador_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  membros_count INTEGER DEFAULT 0,
  eventos_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabela: `membros_comunidade`
```sql
CREATE TABLE membros_comunidade (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comunidade_id UUID REFERENCES comunidades(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  papel VARCHAR(20) DEFAULT 'membro', -- admin, moderador, membro
  status VARCHAR(20) DEFAULT 'ativo', -- ativo, pendente, banido
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comunidade_id, usuario_id)
);
```

### Atualização: `eventos`
```sql
ALTER TABLE eventos ADD COLUMN comunidade_id UUID REFERENCES comunidades(id);
```

## 🎨 Componentes

### 1. CommunityCard.tsx
- Card visual da comunidade
- Informações básicas (nome, membros, categoria)
- Botão de participar/sair
- Link para página da comunidade

### 2. CommunityList.tsx
- Lista de comunidades com filtros
- Busca por nome/categoria
- Paginação
- Estados de loading

### 3. CommunityPage.tsx
- Página completa da comunidade
- Header com banner e informações
- Abas: Eventos, Membros, Sobre
- Ações de moderação (se admin/mod)

### 4. CreateCommunityModal.tsx
- Modal para criar nova comunidade
- Formulário com validações
- Upload de avatar/banner
- Configurações de privacidade

### 5. CommunityMembers.tsx
- Lista de membros da comunidade
- Filtros por papel (admin, mod, membro)
- Ações de moderação
- Busca de membros

### 6. CommunityEvents.tsx
- Eventos específicos da comunidade
- Filtros por data/status
- Criação de eventos da comunidade
- Integração com sistema existente

### 7. JoinCommunityButton.tsx
- Botão inteligente para participar/sair
- Estados diferentes por tipo de comunidade
- Feedback visual
- Confirmações quando necessário

## 🔧 Hooks

### useCommunities.ts
```typescript
interface Community {
  id: string;
  nome: string;
  descricao: string;
  avatar_url?: string;
  banner_url?: string;
  categoria: string;
  tipo: 'publica' | 'privada' | 'restrita';
  criador_id: string;
  membros_count: number;
  eventos_count: number;
  created_at: string;
  updated_at: string;
  // Dados relacionais
  is_member?: boolean;
  user_role?: 'admin' | 'moderador' | 'membro';
}

export function useCommunities() {
  // Listar comunidades
  // Buscar comunidades
  // Filtrar por categoria
  // Paginação
}
```

### useCommunity.ts
```typescript
export function useCommunity(communityId: string) {
  // Dados da comunidade
  // Membros da comunidade
  // Eventos da comunidade
  // Ações de moderação
  // Participar/sair
}
```

## 📱 Páginas

### /communities
- Lista de todas as comunidades
- Filtros e busca
- Botão "Criar Comunidade"
- Comunidades sugeridas

### /communities/[id]
- Página individual da comunidade
- Informações completas
- Eventos da comunidade
- Lista de membros
- Discussões (futuro)

### /communities/create
- Formulário de criação
- Upload de imagens
- Configurações avançadas
- Preview da comunidade

## 🎯 Funcionalidades

### Básicas
- ✅ Criar comunidade
- ✅ Listar comunidades
- ✅ Participar/sair de comunidade
- ✅ Ver membros da comunidade
- ✅ Eventos da comunidade

### Moderação
- ✅ Promover/rebaixar membros
- ✅ Banir/desbanir usuários
- ✅ Editar informações da comunidade
- ✅ Deletar comunidade (só admin)

### Avançadas (Futuro)
- 🔄 Sistema de convites
- 🔄 Discussões/posts na comunidade
- 🔄 Notificações de comunidade
- 🔄 Comunidades privadas com aprovação

## 🔐 Permissões RLS

### Comunidades
```sql
-- Ver comunidades públicas ou onde é membro
CREATE POLICY "Users can view communities" ON comunidades
FOR SELECT USING (
  tipo = 'publica' OR 
  id IN (
    SELECT comunidade_id FROM membros_comunidade 
    WHERE usuario_id = auth.uid() AND status = 'ativo'
  )
);

-- Criar comunidades (usuários autenticados)
CREATE POLICY "Users can create communities" ON comunidades
FOR INSERT WITH CHECK (auth.uid() = criador_id);

-- Editar próprias comunidades ou sendo admin
CREATE POLICY "Users can update own communities" ON comunidades
FOR UPDATE USING (
  criador_id = auth.uid() OR
  id IN (
    SELECT comunidade_id FROM membros_comunidade 
    WHERE usuario_id = auth.uid() AND papel = 'admin'
  )
);
```

### Membros
```sql
-- Ver membros de comunidades onde participa
CREATE POLICY "Users can view community members" ON membros_comunidade
FOR SELECT USING (
  comunidade_id IN (
    SELECT comunidade_id FROM membros_comunidade 
    WHERE usuario_id = auth.uid() AND status = 'ativo'
  )
);

-- Participar de comunidades
CREATE POLICY "Users can join communities" ON membros_comunidade
FOR INSERT WITH CHECK (auth.uid() = usuario_id);
```

## 🎨 Design System

### Cores Específicas
- **Comunidade:** `bg-purple-500` (#8B5CF6)
- **Admin:** `bg-red-500` (#EF4444)
- **Moderador:** `bg-orange-500` (#F97316)
- **Membro:** `bg-blue-500` (#3B82F6)

### Ícones (Lucide)
- `Users` - Comunidades
- `Crown` - Admin
- `Shield` - Moderador
- `User` - Membro
- `Plus` - Criar/Participar
- `Settings` - Configurações

## 📊 Métricas

### Dashboard da Comunidade
- Total de membros
- Eventos criados
- Participação em eventos
- Crescimento mensal
- Membros mais ativos

### Analytics Gerais
- Comunidades mais populares
- Categorias em alta
- Taxa de retenção
- Engajamento por comunidade

## 🚀 Implementação

### Fase 1: Core (v0.0.5)
1. Estrutura de dados (SQL)
2. Componentes básicos
3. Páginas principais
4. CRUD de comunidades
5. Sistema de membros

### Fase 2: Moderação (v0.0.6)
1. Permissões avançadas
2. Sistema de moderação
3. Banimentos e aprovações
4. Logs de atividade

### Fase 3: Social (v0.0.7)
1. Discussões na comunidade
2. Sistema de convites
3. Notificações
4. Gamificação

## ✅ Critérios de Sucesso

- [ ] Usuário pode criar comunidade em < 2 minutos
- [ ] Busca de comunidades funciona perfeitamente
- [ ] Sistema de permissões funciona corretamente
- [ ] Interface responsiva em todos os dispositivos
- [ ] Performance: < 2s para carregar lista de comunidades
- [ ] Zero bugs críticos no sistema de membros

**Pronto para implementar o Sistema de Comunidades! 🚀**