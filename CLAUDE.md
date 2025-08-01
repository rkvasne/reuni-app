# CLAUDE.md

Este arquivo fornece orientações ao Claude Code (claude.ai/code) ao trabalhar com código neste repositório.

## Visão Geral do Projeto

Reuni é uma rede social moderna focada em eventos reais, onde usuários podem descobrir, criar e participar de diversos eventos como shows, meetups, corridas, cursos e encontros. Construído com Next.js 14, React 18, TypeScript e Supabase, combina elementos sociais nostálgicos com tecnologia moderna para criar conexões autênticas através de experiências compartilhadas.

**Versão Atual:** v0.0.11  
**Status:** Pronto para produção com funcionalidades abrangentes

## Comandos de Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm start

# Lint do código
npm run lint

# Build do projeto
npm run build

# Executar sistema de scraping
npm run scraping

# Executar scraping em modo desenvolvimento
npm run scraping:dev
```

## Arquitetura do Projeto

### Estrutura Frontend
- **Next.js 14** com App Router (diretório `app/`)
- **TypeScript** para segurança de tipos
- **Tailwind CSS** com paleta de cores personalizada e sistema de design
- **Arquitetura baseada em componentes** com componentes UI reutilizáveis

### Backend & Dados
- **Supabase** para banco de dados, autenticação, storage e recursos em tempo real
- **PostgreSQL** com políticas Row Level Security (RLS)
- **Hooks customizados** para busca de dados e gerenciamento de estado (`hooks/`)
- **Definições de tipos** em `lib/supabase.ts`

### Diretórios Principais
- `app/` - Páginas do roteador Next.js 14
- `components/` - Componentes React reutilizáveis
- `hooks/` - Hooks React customizados para gerenciamento de dados
- `lib/` - Bibliotecas utilitárias e configuração Supabase
- `utils/` - Funções auxiliares
- `scripts/scraping/` - Sistema de scraping de eventos para dados externos
- `supabase/migrations/` - Migrações do banco de dados

### Arquitetura dos Componentes Principais
- **Header.tsx**: Navegação principal com busca inteligente, filtros e menu do usuário
- **MainFeed.tsx**: Feed de descoberta de eventos com scroll infinito
- **EventCard.tsx**: Componente de exibição de eventos com recursos sociais
- **AuthModal.tsx**: Autenticação com email/senha e Google OAuth
- **SearchResults.tsx**: Busca avançada com filtros e sugestões

### Modelos de Dados
Entidades principais incluem:
- **User**: Autenticação e gerenciamento de perfil
- **Event**: Criação, descoberta e participação em eventos
- **Community**: Grupos de usuários e gerenciamento de comunidades
- **Presence**: Rastreamento de participação em eventos
- **Comment**: Interações sociais e discussões

### Sistema de Design Personalizado
- **Paleta de cores baseada em roxo** com cores primárias (#9B59B6) e secundárias
- **Fundos gradientes** e efeitos glassmorfismo
- **Sombras customizadas** (reuni, reuni-lg, reuni-xl) com tons roxos
- **Breakpoints responsivos** com abordagem mobile-first

## Configuração do Banco de Dados

**Migrações Críticas Necessárias:**
- Execute `supabase/migrations/011_FINAL_fix_events.sql` para o sistema de eventos
- Execute `supabase/migrations/012_FINAL_setup_storage.sql` para armazenamento de arquivos
- Certifique-se de que as políticas RLS estão configuradas adequadamente para segurança dos dados

## Configuração de Ambiente

Variáveis de ambiente obrigatórias em `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_supabase
```

A aplicação inclui validação automática de ambiente com avisos úteis se o Supabase não estiver configurado.

## Sistema de Scraping de Eventos

O projeto inclui um sistema sofisticado de scraping de eventos em `scripts/scraping/`:
- **Scraping multi-plataforma** (Eventbrite, Sympla)
- **Foco geográfico** em Ji-Paraná/RO e principais cidades brasileiras
- **Validação e garantia de qualidade** dos dados
- **Estatísticas em tempo real** e monitoramento
- **Tratamento de erros** e mecanismos de retry

## Estratégia de Testes

- **Jest** configurado
- Arquivos de teste localizados em `scripts/scraping/tests/`
- Foco em testes de integração para sistema de scraping
- Testes unitários para utilitários principais e processadores

## Notas de Desenvolvimento

### Tratamento de Imagens
- **Otimização de imagens Next.js** configurada para múltiplos domínios
- **Integração Supabase Storage** para uploads de usuários
- **Suporte a imagens externas** para dados de eventos coletados

### Otimizações de Performance
- **Implementação de scroll infinito** para listas grandes de eventos
- **Carregamento otimizado de imagens** com uso adequado do componente Next.js Image
- **Utilitários de cache de eventos** em `utils/eventCache.ts`
- **Lógica de retry do Supabase** para maior confiabilidade

### Fluxo de Autenticação
- **Autenticação magic link** para cadastro apenas com email
- **Integração Google OAuth**
- **Gerenciamento de sessão** com refresh automático de tokens
- **Rotas protegidas** com guards de autenticação

## Problemas Comuns & Soluções

### Erros de Configuração de Imagem
Se encontrar erros de hostname não configurado, certifique-se de que todos os domínios necessários estão adicionados à configuração de imagens em `next.config.js` e reinicie o servidor de desenvolvimento.

### Erros de Coluna do Banco
Execute as migrações necessárias em `supabase/migrations/` se encontrar erros de coluna não encontrada, particularmente `011_FINAL_fix_events.sql`.

### Erros de Bucket de Storage
Execute `012_FINAL_setup_storage.sql` se encontrar erros de bucket de storage, e verifique se Storage está habilitado no Supabase.

## Padrões de Qualidade de Código

- **Modo strict TypeScript** habilitado
- **Configuração ESLint** com regras Next.js
- **Composição de componentes** ao invés de herança
- **Hooks customizados** para lógica reutilizável
- **Linguagem portuguesa** para texto de UI e conteúdo voltado ao usuário
- **Nomenclatura consistente** usando português para entidades voltadas ao usuário

## Integridade dos Dados

- **Política de 100% dados reais** - sem dados falsos ou placeholder
- **Validação de dados** em múltiplas camadas
- **Tratamento adequado de erros** com mensagens amigáveis ao usuário
- **Degradação graceful** quando serviços não estão disponíveis