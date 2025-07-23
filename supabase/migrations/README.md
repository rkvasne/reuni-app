# Migrações do Supabase - Sistema de Comunidades

Este diretório contém todas as migrações SQL organizadas cronologicamente para facilitar a manutenção e aplicação.

## 📋 Ordem de Execução

### Migrações Principais (Execute em ordem)

1. **`001_initial_communities_migration.sql`** - Migração inicial completa
   - Cria/atualiza tabela `comunidades`
   - Cria tabela `membros_comunidade`
   - Adiciona índices de performance
   - Configura relacionamentos

2. **`002_rls_policies_setup.sql`** - Configuração de políticas RLS
   - Habilita Row Level Security
   - Cria políticas de acesso para comunidades
   - Cria políticas de acesso para membros

3. **`003_triggers_and_functions.sql`** - Triggers e funções
   - Função para atualizar contador de membros
   - Função para atualizar contador de eventos
   - Triggers automáticos para manter contadores

### Migrações Alternativas

4. **`004_minimal_migration.sql`** - Migração mínima
   - Versão simplificada da migração inicial
   - Use se a migração completa falhar

### Scripts de Verificação

5. **`005_check_structure.sql`** - Verificar estrutura das tabelas
6. **`006_test_communities.sql`** - Inserir dados de teste
7. **`007_safe_test.sql`** - Verificações sem inserções
8. **`008_quick_check.sql`** - Verificação rápida
9. **`009_fix_admins.sql`** - Corrigir criadores como admins

### Correções RLS (Criadas Recentemente)

10. **`010_fix_rls_recursion.sql`** - ⚠️ Correção para recursão RLS
    - Use quando houver erro "infinite recursion detected"
    - Remove políticas problemáticas
    - Cria políticas simples sem recursão

11. **`011_disable_rls_temp.sql`** - ⚠️ Desabilitar RLS temporariamente
    - **APENAS PARA DESENVOLVIMENTO**
    - Remove todas as políticas RLS
    - Use como último recurso

## 🚀 Como Usar

### Primeira Instalação
```sql
-- 1. Execute a migração inicial
\i 001_initial_communities_migration.sql

-- 2. Configure as políticas RLS
\i 002_rls_policies_setup.sql

-- 3. Configure triggers e funções
\i 003_triggers_and_functions.sql
```

### Se Houver Erro de Recursão RLS
```sql
-- Opção 1: Corrigir políticas (recomendado)
\i 010_fix_rls_recursion.sql

-- Opção 2: Desabilitar temporariamente (desenvolvimento)
\i 011_disable_rls_temp.sql
```

### Verificar Instalação
```sql
-- Verificação completa
\i 007_safe_test.sql

-- Verificação rápida
\i 008_quick_check.sql
```

## 🔧 Resolução de Problemas

### Erro: "infinite recursion detected"
- **Causa**: Políticas RLS com referências circulares
- **Solução**: Execute `010_fix_rls_recursion.sql`

### Erro: "relation does not exist"
- **Causa**: Tabelas não foram criadas
- **Solução**: Execute `001_initial_communities_migration.sql`

### Comunidades sem admin
- **Causa**: Criadores não foram adicionados como admins
- **Solução**: Execute `009_fix_admins.sql`

### Contadores incorretos
- **Causa**: Triggers não configurados ou dados inconsistentes
- **Solução**: Execute `003_triggers_and_functions.sql`

## 📊 Estrutura Final

Após executar as migrações principais, você terá:

### Tabela `comunidades`
- `id` (UUID, PK)
- `nome` (VARCHAR, NOT NULL)
- `descricao` (TEXT)
- `avatar_url` (TEXT)
- `banner_url` (TEXT)
- `categoria` (VARCHAR, NOT NULL)
- `tipo` (VARCHAR, CHECK: publica/privada/restrita)
- `criador_id` (UUID, FK → usuarios)
- `membros_count` (INTEGER, auto-atualizado)
- `eventos_count` (INTEGER, auto-atualizado)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Tabela `membros_comunidade`
- `id` (UUID, PK)
- `comunidade_id` (UUID, FK → comunidades)
- `usuario_id` (UUID, FK → usuarios)
- `papel` (VARCHAR, CHECK: admin/moderador/membro)
- `status` (VARCHAR, CHECK: ativo/pendente/banido)
- `joined_at` (TIMESTAMP)
- UNIQUE(comunidade_id, usuario_id)

### Políticas RLS
- Comunidades públicas visíveis para todos
- Comunidades privadas apenas para membros
- Criadores podem gerenciar suas comunidades
- Membros podem participar e sair

### Triggers
- Contador de membros atualizado automaticamente
- Contador de eventos atualizado automaticamente

## 🔄 Versionamento

Os arquivos seguem a convenção:
- `001_xxx` - Migrações principais
- `004_xxx` - Correções específicas
- `007_xxx` - Scripts de verificação

Para adicionar nova migração:
1. Crie arquivo `012_nova_funcionalidade.sql`
2. Documente no README
3. Teste em ambiente de desenvolvimento
4. Aplique em produção

## ⚠️ Avisos Importantes

- **Sempre faça backup** antes de executar migrações
- **Teste em desenvolvimento** antes de aplicar em produção
- **Execute em ordem** para evitar dependências quebradas
- **Não modifique** arquivos já aplicados, crie novos
- **Scripts 011_xxx** são apenas para desenvolvimento