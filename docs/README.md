# Documentação - Reuni App

Documentação completa do sistema de eventos e comunidades.

## 📁 Estrutura da Documentação

### 🚀 [Setup](./setup/)
- **[Configuração Inicial](./setup/SETUP.md)** - Como configurar o projeto
- **[Configuração Supabase](./setup/SUPABASE_SETUP.md)** - Banco de dados e autenticação
- **[Migrações](../supabase/migrations/README.md)** - Scripts SQL organizados

### 📋 [Especificações](./features/)
- **[PRD - Product Requirements](./PRD.md)** - Documento de requisitos do produto
- **[Sistema de Comunidades](./features/COMMUNITIES_SPEC.md)** - Especificação v0.0.5
- **[Sistema de Moderação](./features/MODERATION_SPEC_v0.0.7.md)** - Especificação v0.0.7

### ✨ [Features](./features/)
- **[Sistema de Comunidades](./features/COMMUNITIES.md)** - Funcionalidades das comunidades
- **[Sistema de Busca](./features/SEARCH.md)** - Funcionalidades de busca
- **[Sistema de Perfil](./features/PROFILE.md)** - Funcionalidades do perfil
- **[Otimizações](./features/OPTIMIZATIONS.md)** - Melhorias de performance

### 🔧 [Correções](./fixes/)
- **[Problemas RLS](./fixes/RLS_ISSUES.md)** - Soluções para Row Level Security
- **[Correções de Layout](./fixes/LAYOUT_FIXES.md)** - Ajustes visuais
- **[Correções de Navegação](./fixes/NAVIGATION_FIXES.md)** - Melhorias de UX

### 📋 [Releases](./releases/)
- **[v0.0.5](./releases/v0.0.5.md)** - Sistema de Comunidades
- **[v0.0.4](./releases/v0.0.4.md)** - Sistema de Busca
- **[v0.0.3](./releases/v0.0.3.md)** - Sistema de Perfil

## 🎯 Links Rápidos

### Para Desenvolvedores
- [Configuração do Projeto](./setup/SETUP.md)
- [Migrações do Banco](../supabase/migrations/README.md)
- [Problemas Comuns](./fixes/RLS_ISSUES.md)

### Para Product Managers
- [Especificações](./features/COMMUNITIES.md)
- [Releases](./releases/)
- [Status do Projeto](./STATUS.md)

### Para QA
- [Testes](../supabase/migrations/008_test_communities.sql)
- [Verificações](../supabase/migrations/009_safe_test.sql)

## 📊 Status Atual

- ✅ **Sistema de Comunidades** - Implementado (v0.0.5)
- ✅ **Sistema de Busca** - Implementado (v0.0.4)  
- ✅ **Sistema de Perfil** - Implementado (v0.0.3)
- ✅ **Otimizações de Layout** - Implementado
- ⚠️ **Problemas RLS** - Soluções disponíveis

## 🔄 Changelog

Veja o [CHANGELOG.md](./CHANGELOG.md) para histórico completo de mudanças.

## 🆘 Suporte

Para problemas específicos:
1. Consulte a seção [Correções](./fixes/)
2. Verifique as [Migrações](../supabase/migrations/README.md)
3. Execute os [Scripts de Verificação](../supabase/migrations/009_safe_test.sql)