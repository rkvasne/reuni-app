# Changelog - Reuni

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [0.0.5] - 2025-07-23 (FINAL)

### ✅ Adicionado
- **Sistema de Comunidades Completo:**
  - Página de comunidades dedicada em `/communities`
  - CRUD completo (criar, visualizar, editar, deletar comunidades)
  - Sistema de membros com papéis (admin, moderador, membro)
  - 12 categorias com cores e ícones específicos
  - Tipos de comunidade (pública, privada, restrita)
  - Contadores automáticos de membros e eventos
  - Modal completo para criação de comunidades
- **Componentes Novos:**
  - `CommunityCard.tsx` - Card visual das comunidades
  - `CommunityList.tsx` - Lista responsiva com busca e filtros
  - `CreateCommunityModal.tsx` - Modal de criação
  - `RLSWarning.tsx` - Avisos para problemas RLS
  - `useCommunities.ts` - Hook principal de comunidades
  - `useCommunity.ts` - Hook para comunidade específica
- **Banco de Dados:**
  - Tabela `comunidades` com todas as informações
  - Tabela `membros_comunidade` para relacionamentos
  - Triggers automáticos para contadores
  - Políticas RLS baseadas em papéis
  - Integração com eventos (eventos podem pertencer a comunidades)
- **Documentação Reorganizada:**
  - Estrutura `docs/` com features, setup, fixes, releases
  - Migrações SQL organizadas em `supabase/migrations/`
  - README principal com links organizados
  - Eliminação de redundâncias e arquivos duplicados

### 🔧 Melhorado
- **Layout Padronizado:** Página de comunidades agora usa o mesmo padrão de 3 colunas
- **Navegação Funcional:** Todos os links do menu lateral agora funcionam
- **Tratamento de Erros RLS:** Sistema de fallback com dados de exemplo
- **Otimizações de Performance:**
  - MainFeed com ~220px a mais de espaço para eventos
  - Header com busca centralizada
  - Página de busca com layout integrado
- **Migrações Organizadas:** 11 arquivos SQL numerados cronologicamente
- **Documentação Consolidada:** Estrutura limpa e organizada

### 🐛 Corrigido
- Erro de recursão infinita nas políticas RLS
- Layout inconsistente da página de comunidades
- Links de navegação não funcionais no menu lateral
- Problemas de z-index em modais
- Referências a colunas inexistentes no banco
- **Sintaxe SQL:** Todos os `DO $` → `DO $$` e loops `FOR` com `DECLARE rec RECORD;`
- **Ordem Cronológica:** Scripts SQL renumerados seguindo ordem real de criação

## [0.0.4] - 2025-07-22

### ✅ Adicionado
- **Sistema de Busca Avançada Completo:**
  - Página de busca dedicada em `/search`
  - Barra de busca inteligente com autocomplete
  - Filtros avançados (categoria, data, local, status, ordenação)
  - Busca por texto em título, descrição e local
  - Histórico de buscas com armazenamento local
  - Sugestões inteligentes em tempo real
  - Resultados paginados com navegação
  - Estatísticas de busca e métricas
  - Integração no feed principal com busca rápida
- **Componentes Novos:**
  - `SearchBar.tsx` - Barra de busca principal
  - `AdvancedFilters.tsx` - Modal de filtros avançados
  - `SearchResults.tsx` - Exibição de resultados
  - `SearchSuggestions.tsx` - Sugestões automáticas
  - `SearchStats.tsx` - Estatísticas de busca
  - `QuickSearch.tsx` - Busca rápida no feed
  - `useSearch.ts` - Hook para lógica de busca

### 🔧 Melhorado
- Header com busca funcional redirecionando para `/search`
- MainFeed com componente de busca rápida integrado
- Z-index dos modais corrigido para evitar sobreposição
- Performance de busca com debounce e paginação

### 🐛 Corrigido
- Problema de z-index do EventModal sobrepondo elementos
- Erro de coluna `updated_at` inexistente no perfil do usuário
- Compatibilidade TypeScript com operador spread em Set

## [0.0.3] - 2025-07-22

### ✅ Adicionado
- **Sistema de Perfil de Usuário Completo:**
  - Página de perfil protegida em `/profile`
  - Informações do usuário com avatar, nome, bio, email
  - Edição inline de nome e bio com hover states
  - Modal para upload/alteração de avatar
  - Estatísticas detalhadas (6 métricas diferentes)
  - Gestão de eventos em abas ("Meus Eventos" e "Vou Participar")
  - Visualização flexível (grid/lista) para eventos
  - Configurações completas (perfil, senha, conta)
- **Componentes Novos:**
  - `UserProfile.tsx` - Página principal do perfil
  - `ProfileSettings.tsx` - Configurações da conta
  - `QuickProfileEdit.tsx` - Edição inline de campos
  - `EventGrid.tsx` - Visualização de eventos em grid/lista
  - `UserStats.tsx` - Estatísticas do usuário
  - `AvatarUpload.tsx` - Modal para alterar avatar
  - `useUserProfile.ts` - Hook para gerenciar dados do perfil

### 🔧 Melhorado
- Hook `useAuth` integrado com dados completos do usuário
- Navegação no Header com links para o perfil
- UX/UI com loading states e feedback visual
- Validações e tratamento de erros aprimorados

## [0.0.2] - 2025-07-22

### ✅ Adicionado
- **CRUD de Eventos Completo:**
  - Criar novos eventos com modal completo e validações
  - Editar eventos existentes (apenas organizadores)
  - Deletar eventos com confirmação (apenas organizadores)
  - Visualização detalhada de eventos em modal
- **Sistema de Presenças:**
  - Participar/cancelar participação em eventos
  - Contagem de participantes em tempo real
  - Lista completa de participantes no modal do evento
  - Status visual de participação ("Confirmado", "Eu Vou!")
- **Validações e UX:**
  - Validação de data/hora (não pode ser no passado)
  - Estados de loading e feedback visual
  - Tratamento de erros com mensagens claras
  - Menu de ações contextual para organizadores

### 🔧 Melhorado
- Hook `useEvents` com todas as operações CRUD
- Componente `EventCard` com ações completas
- Componente `EventModal` com modos create/edit/view
- Componente `ParticipantsList` para visualização de participantes

## [0.0.1] - 2025-07-21

### ✅ Adicionado
- Sistema de autenticação completo com Supabase Auth
- Login/cadastro com email/senha e Google OAuth
- Interface integrada (landing page + aplicação principal)
- Layout responsivo de 3 colunas (Header, LeftSidebar, MainFeed, RightSidebar)
- Componentes principais do feed de eventos
- Modal de autenticação com design moderno
- Hook personalizado para gerenciamento de estado de autenticação
- Identidade visual única com paleta de cores própria
- Documentação completa (PRD, SETUP, STATUS, Specs técnicos)

## Estratégia de Plataforma

### Fase 1: Web App Responsiva (0-6 meses)
- ✅ Base da aplicação web implementada
- ✅ Sistema de perfil completo
- ✅ Sistema de busca avançada
- ✅ Sistema de comunidades
- 🔄 PWA features em desenvolvimento
- 📋 Web push notifications planejado
- 📋 Offline support planejado

### Fase 2: Apps Nativos (6-12 meses)
- 📋 React Native para Android e iOS
- 📋 Features nativas (câmera, GPS, push notifications)
- 📋 Distribuição via app stores
- 📋 Sincronização cross-platform

## Stack Tecnológico

**Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS  
**Backend:** Supabase (PostgreSQL, Auth, Storage, Real-time)  
**Deploy:** Vercel  
**Icons:** Lucide React  
**Futuro:** React Native para apps móveis

---

*Formato baseado em [Keep a Changelog](https://keepachangelog.com/)*