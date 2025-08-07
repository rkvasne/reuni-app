# Migração da Tabela Comunidades - Task 6

## Visão Geral

Esta documentação descreve a implementação da **Task 6** da spec `database-schema`: **Corrigir tabela comunidades existente**.

## Estado Atual da Tabela

### Campos Existentes ✅
- `id` (UUID, PK)
- `nome` (VARCHAR(100), NOT NULL)
- `descricao` (TEXT)
- `categoria` (VARCHAR(50))
- `tipo` (VARCHAR(50)) - será migrado para `privada`
- `criador_id` (UUID, FK)
- `regras` (TEXT) - adicionado na migração 016
- `tags` (TEXT[]) - adicionado na migração 016
- `membros_count` (INTEGER)
- `eventos_count` (INTEGER)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Campos a Adicionar ➕
- `privada` (BOOLEAN) - substitui o campo `tipo`
- `cidade` (VARCHAR(100)) - para localização

## Migração 017: Correção da Tabela Comunidades

### Arquivo: `supabase/migrations/017_fix_comunidades_table.sql`

### Principais Alterações:

1. **Novos Campos**:
   - `privada BOOLEAN DEFAULT FALSE`
   - `cidade VARCHAR(100)`

2. **Migração de Dados**:
   - Converte `tipo` ('privada'/'restrita' → TRUE, 'publica' → FALSE)

3. **Constraints**:
   - Nome mínimo 3 caracteres
   - Descrição máximo 1000 caracteres

4. **Índices Otimizados**:
   - `idx_comunidades_categoria`
   - `idx_comunidades_cidade`
   - `idx_comunidades_criador`
   - `idx_comunidades_privada`
   - `idx_comunidades_tags` (GIN)
   - `idx_comunidades_texto` (GIN, full-text)

5. **Políticas RLS**:
   - **SELECT**: Comunidades públicas ou onde é membro
   - **INSERT**: Usuários autenticados
   - **UPDATE**: Criador ou admin/moderador
   - **DELETE**: Apenas criador

6. **Triggers**:
   - `update_comunidades_updated_at` para campo `updated_at`

## Como Aplicar a Migração

### Opção 1: Supabase CLI (Recomendado)
```bash
supabase db push
```

### Opção 2: SQL Editor do Supabase
1. Abra o SQL Editor no dashboard do Supabase
2. Cole o conteúdo de `017_fix_comunidades_table.sql`
3. Execute o script

### Opção 3: Aplicação Manual
```bash
psql -h [host] -U postgres -d postgres -f supabase/migrations/017_fix_comunidades_table.sql
```

## Scripts de Teste

### 1. Verificação Pré-Migração
```bash
node scripts/check-comunidades-structure.js
```

### 2. Aplicação da Migração
```bash
node scripts/apply-comunidades-migration.js
```

### 3. Validação Pós-Migração
```bash
node scripts/validate-comunidades-migration.js
```

## Validação da Migração

### Campos Obrigatórios
- [ ] `privada` (BOOLEAN)
- [ ] `cidade` (VARCHAR(100))
- [ ] Migração de dados `tipo` → `privada`

### Constraints
- [ ] Nome mínimo 3 caracteres
- [ ] Descrição máximo 1000 caracteres

### Índices
- [ ] Índices básicos (categoria, cidade, criador, privada)
- [ ] Índices especializados (tags GIN, texto GIN)

### RLS
- [ ] Políticas configuradas corretamente
- [ ] Acesso público para comunidades não privadas
- [ ] Acesso restrito para comunidades privadas

### Triggers
- [ ] `updated_at` atualizado automaticamente

## Problemas Conhecidos

### 1. RLS Muito Restritivo
**Sintoma**: Erro "row-level security policy" ao inserir
**Solução**: Políticas estão funcionando corretamente, inserção deve ser feita com usuário autenticado

### 2. Campo `tipo` Ainda Existe
**Status**: Normal - campo será removido em migração futura após validação completa

### 3. Comunidades Sem Dados
**Status**: Normal - tabela pode estar vazia em ambiente de desenvolvimento

## Próximos Passos

1. ✅ Aplicar migração 017
2. ✅ Validar estrutura da tabela
3. ⏳ Testar políticas RLS com usuários reais
4. ⏳ Validar performance dos índices
5. ⏳ Considerar remoção do campo `tipo`
6. ⏳ Marcar Task 6 como concluída

## Dependências

### Tabelas Relacionadas
- `usuarios` (criador_id)
- `membros_comunidade` (políticas RLS)
- `eventos` (comunidade_id)

### Funções Necessárias
- `update_updated_at_column()` - para trigger

### Migrações Anteriores
- `016_fix_database_inconsistencies.sql` - adiciona campos base

## Rollback (Se Necessário)

```sql
-- Remover campos adicionados
ALTER TABLE comunidades 
DROP COLUMN IF EXISTS privada,
DROP COLUMN IF EXISTS cidade;

-- Remover índices
DROP INDEX IF EXISTS idx_comunidades_privada;
DROP INDEX IF EXISTS idx_comunidades_cidade;

-- Remover políticas
DROP POLICY IF EXISTS "comunidades_select_public_or_member" ON comunidades;
-- ... outras políticas
```

## Contato

Para dúvidas sobre esta migração, consulte:
- Spec: `.kiro/specs/database-schema/`
- Tasks: `.kiro/specs/database-schema/tasks.md`
- Design: `.kiro/specs/database-schema/design.md`