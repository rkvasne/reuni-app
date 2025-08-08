# Scripts do Projeto Reuni

Este diretório contém todos os scripts organizados em ordem cronológica de criação/implementação.

## 📋 Índice de Scripts

### 🏗️ Scripts de Configuração e Setup
- **001-setup-storage.js** - Configuração inicial do Supabase Storage
- **002-check-ci-setup.js** - Verificação da configuração de CI/CD

### 🗄️ Scripts de Migração de Banco de Dados
- **003-run-rename-migration.js** - Migração de renomeação de campos
- **004-apply-migration-018.js** - Aplicação da migração 018
- **005-test-migration-017.js** - Teste da migração 017
- **006-verify-migration.js** - Verificação geral de migrações
- **007-apply-comunidades-migration.js** - Migração da tabela comunidades
- **008-test-comunidades-migration.js** - Teste da migração de comunidades
- **009-validate-comunidades-migration.js** - Validação da migração de comunidades
- **010-check-comunidades-structure.js** - Verificação da estrutura de comunidades
- **011-fix-membros-comunidade-fields.js** - Correção de campos da tabela membros_comunidade
- **012-test-membros-comunidade.js** - Teste da tabela membros_comunidade
- **013-final-test-membros-comunidade.js** - Teste final da tabela membros_comunidade
- **014-test-presencas-structure.js** - Teste da estrutura da tabela presencas
- **015-validate-presencas-migration.js** - Validação da migração de presencas

### 🔒 Scripts de RLS e Segurança
- **016-test-rls-policies.js** - Teste das políticas RLS
- **017-run-rls-tests-direct.js** - Execução direta dos testes RLS
- **018-apply-and-validate-rls-migration.js** - Aplicação e validação da migração RLS

### ⚡ Scripts de Performance e Otimização
- **019-apply-query-optimizations.js** - Aplicação de otimizações de consulta
- **020-test-query-optimizations.js** - Teste das otimizações de consulta

### 🧪 Scripts de Teste e Middleware
- **021-test-middleware.js** - Teste do middleware de autenticação

### 📊 Scripts de Verificação e Status
- **022-verify-all-tasks-status.js** - Verificação do status de todas as tasks

## 📁 Organização da Estrutura

### 🔢 Scripts Principais (na raiz)
Scripts de desenvolvimento, migração e operações principais que são usados frequentemente:
- **001-002**: Setup e configuração inicial
- **003-015**: Migrações de banco de dados (ordem cronológica)
- **016-018**: RLS e segurança
- **019-020**: Otimizações de performance
- **021-022**: Testes e verificação

### 📁 Scripts Especializados (subpastas)
Scripts organizados por domínio específico:

#### 🧹 `/maintenance`
~~Pasta removida - scripts obsoletos foram deletados~~

#### 📊 `/monitoring`  
Scripts de monitoramento e observabilidade:
- monitor-supabase.js - Monitor de conectividade em tempo real
- test-supabase.js - Teste de conectividade e diagnóstico

#### 🕷️ `/scraping`
Sistema completo e independente de web scraping:
- Estrutura própria com package.json
- Múltiplas subpastas especializadas
- Pode ser executado separadamente

## 🎯 Lógica da Organização

**Por que alguns scripts estão na raiz e outros em pastas?**

✅ **Na Raiz**: Scripts do fluxo principal de desenvolvimento
- Usados frequentemente
- Parte do ciclo de vida do projeto
- Fáceis de encontrar (ordem cronológica)

✅ **Em Subpastas**: Scripts especializados por domínio
- Usados esporadicamente
- Focados em área específica
- Organizados por funcionalidade

**Nota**: A pasta `/maintenance` foi removida pois continha scripts obsoletos.

## 🔄 Convenções de Nomenclatura

- **Prefixo numérico**: 001, 002, 003... (ordem cronológica)
- **Nome descritivo**: Indica claramente a função do script
- **Extensão .js**: Todos os scripts são em JavaScript/Node.js

## 📅 Histórico de Criação

**Data de Organização**: 07/08/2025  
**Versão do Projeto**: 0.0.13  
**Total de Scripts**: 22 scripts principais + 2 scripts de monitoring + 1 sistema de scraping

## 🚀 Como Executar

```bash
# Executar um script específico
node scripts/001-setup-storage.js

# Executar via npm (se configurado)
npm run script-name

# Executar com parâmetros
node scripts/002-check-ci-setup.js --verbose
```

## 📝 Notas

- Scripts estão organizados por ordem cronológica de implementação
- Cada script deve ser independente e documentado
- Scripts de teste podem ser executados múltiplas vezes
- Scripts de migração devem ser executados apenas uma vez em produção

---

**Última Atualização**: 07/08/2025  
**Responsável**: Organização de Scripts  
**Status**: Organizado e atualizado para v0.0.13