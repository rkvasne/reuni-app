# 📚 Documentação - Reuni App

Documentação completa do sistema de eventos e comunidades com scraping inteligente.

## 📁 Estrutura Reorganizada (v0.0.11)

### 🔧 [Technical](./technical/) - Documentação Técnica
- **[SISTEMA-EVENTOS-COMPLETO.md](./technical/SISTEMA-EVENTOS-COMPLETO.md)** - Documentação técnica completa
- **[PADRÕES-AVANÇADOS-IMPLEMENTADOS.md](./technical/PADRÕES-AVANÇADOS-IMPLEMENTADOS.md)** - Algoritmos de limpeza
- **[CORREÇÕES-FINAIS-IMPLEMENTADAS.md](./technical/CORREÇÕES-FINAIS-IMPLEMENTADAS.md)** - Últimas correções
- **[OTIMIZAÇÃO-PERFORMANCE.md](./technical/OTIMIZAÇÃO-PERFORMANCE.md)** - Otimizações de performance

### 📋 [Project](./project/) - Gestão do Projeto
- **[PRD.md](./project/PRD.md)** - Documento de requisitos do produto
- **[ORGANIZACAO-FINAL.md](./project/ORGANIZACAO-FINAL.md)** - Registro da organização
- **[LIMPEZA-REDUNDANCIAS-FINAL.md](./project/LIMPEZA-REDUNDANCIAS-FINAL.md)** - Registro da limpeza

### 🛠️ [Development](./development/) - Desenvolvimento
- **[Setup](./development/setup/)** - Guias de configuração
  - [Configuração Inicial](./development/setup/SETUP.md)
  - [Configuração Supabase](./development/setup/SUPABASE_SETUP.md)
- **[Features](./development/features/)** - Documentação de funcionalidades
  - [Sistema de Comunidades](./development/features/COMMUNITIES.md)
  - [Sistema de Busca](./development/features/SEARCH.md)
  - [Sistema de Perfil](./development/features/PROFILE.md)
- **[Fixes](./development/fixes/)** - Correções implementadas
  - [Problemas RLS](./development/fixes/RLS_ISSUES.md)
  - [Correções de Layout](./development/fixes/LAYOUT_FIXES.md)

### 📋 [Releases](./releases/) - Histórico de Versões
- **[v0.0.10](./releases/v0.0.10.md)** - Limpeza final e organização profissional
- **[v0.0.8](./releases/v0.0.8.md)** - Limpeza de dados e melhorias
- **[v0.0.7](./releases/v0.0.7.md)** - Sistema social completo
- **[v0.0.6](./releases/v0.0.6.md)** - Correções e otimizações
- **[HISTORICO-RELEASES.md](./releases/HISTORICO-RELEASES.md)** - Versões anteriores (v0.0.3-v0.0.5)

## 🎯 Links Rápidos

### Para Desenvolvedores
- [Configuração do Projeto](./development/setup/SETUP.md)
- [Migrações do Banco](../supabase/migrations/README.md)
- [Problemas Comuns](./development/fixes/RLS_ISSUES.md)

### Para Product Managers
- [Especificações](./development/features/COMMUNITIES.md)
- [Releases](./releases/)
- [Requisitos do Produto](./project/PRD.md)

### Para QA
- [Testes](../supabase/migrations/008_test_communities.sql)
- [Verificações](../supabase/migrations/009_safe_test.sql)

## 📊 Status Atual (v0.0.11)

- ✅ **Sistema de Scraping** - 100% funcional (14/14 tarefas concluídas)
- ✅ **Padrões Avançados** - Limpeza inteligente de títulos (95% melhoria)
- ✅ **Interface Profissional** - Cards estilo Facebook + scroll infinito
- ✅ **Cobertura Nacional** - 40+ cidades (Rondônia completa + capitais)
- ✅ **Sistema de Comunidades** - Implementado (v0.0.5)
- ✅ **Sistema de Busca** - Implementado (v0.0.4)  
- ✅ **Sistema de Perfil** - Implementado (v0.0.3)
- ✅ **Documentação** - Estrutura profissional reorganizada por categorias
- ✅ **Scripts** - Organizados por função (monitoring, maintenance, scraping)

## 🔄 Changelog

Veja o [CHANGELOG.md](../CHANGELOG.md) para histórico completo de mudanças.

## 🆘 Suporte

Para problemas específicos:
1. Consulte a seção [Fixes](./development/fixes/)
2. Verifique as [Migrações](../supabase/migrations/README.md)
3. Execute os [Scripts de Verificação](../supabase/migrations/009_safe_test.sql)

---

**📁 Estrutura organizada por categorias para melhor navegação e manutenção**