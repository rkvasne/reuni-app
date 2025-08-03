# 🔄 Migração: Renomear Campos da Tabela Eventos

## 📋 Resumo

Esta migração altera os nomes de dois campos na tabela `eventos` para melhor semântica:

- `eventos.descricao` → `eventos.local`
- `eventos.local` → `eventos.cidade`

## 🎯 Objetivo

Melhorar a clareza e semântica dos campos:
- O campo `descricao` agora se chama `local` (para armazenar o endereço/local do evento)
- O campo `local` agora se chama `cidade` (para armazenar a cidade/estado)

## 📁 Arquivos Criados

1. **`supabase/migrations/013_rename_eventos_fields.sql`** - Script de migração
2. **`scripts/run-rename-migration.js`** - Script para executar a migração
3. **`docs/migrations/RENAME_EVENTOS_FIELDS.md`** - Esta documentação

## 🚀 Como Executar

### Opção 1: Via Script Node.js
```bash
# Certifique-se de que as variáveis de ambiente estão configuradas
export NEXT_PUBLIC_SUPABASE_URL="sua_url_do_supabase"
export SUPABASE_SERVICE_ROLE_KEY="sua_service_role_key"

# Executar migração
node scripts/run-rename-migration.js
```

### Opção 2: Via Supabase Dashboard
1. Acesse o Supabase Dashboard
2. Vá para SQL Editor
3. Cole o conteúdo do arquivo `013_rename_eventos_fields.sql`
4. Execute o script

### Opção 3: Via Supabase CLI
```bash
# Se você tem o Supabase CLI configurado
supabase db push
```

## ⚠️ Importante: Atualizações Necessárias no Código

Após executar a migração, você **DEVE** atualizar o código da aplicação:

### 1. Hooks e Tipos
- `hooks/useEvents.ts`
- `hooks/useOptimizedEvents.ts`
- Qualquer interface que use `Event`

### 2. Componentes
- `components/EventCard.tsx`
- `components/EventModal.tsx`
- `components/EventSlider.tsx`
- Qualquer componente que exiba dados de eventos

### 3. Queries do Supabase
- Todas as queries que selecionam `descricao` devem usar `local`
- Todas as queries que selecionam `local` devem usar `cidade`

## 🔍 Verificação

Após a migração, a tabela `eventos` deve ter esta estrutura:

```sql
CREATE TABLE eventos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    titulo character varying(200) NOT NULL,
    local text,                    -- Antigo: descricao
    data date NOT NULL,
    hora time without time zone NOT NULL,
    cidade character varying(300) NOT NULL,  -- Antigo: local
    categoria character varying(50) NOT NULL,
    imagem_url text,
    organizador_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    comunidade_id uuid,
    max_participantes integer,
    source character varying(50) DEFAULT 'manual',
    external_url text
);
```

## 🔄 Rollback (Se Necessário)

Se precisar reverter a migração:

```sql
-- Reverter as alterações
ALTER TABLE eventos RENAME COLUMN local TO descricao;
ALTER TABLE eventos RENAME COLUMN cidade TO local;
```

## 📝 Logs de Execução

A migração inclui logs detalhados que mostram:
- ✅ Verificação da estrutura atual
- ✅ Confirmação de cada etapa da renomeação
- ✅ Verificação final da nova estrutura
- ✅ Resumo das alterações realizadas

## 🎉 Resultado Esperado

Após a migração bem-sucedida, você verá:
```
🔍 Verificando estrutura atual da tabela eventos...
✅ Campo "descricao" existe
✅ Campo "local" existe
📖 Executando migração...
🔍 Verificando estrutura após renomeação...
✅ Campo "local" existe (antigo descricao)
✅ Campo "cidade" existe (antigo local)
🎉 Migração concluída com sucesso!
📋 Resumo das alterações:
   - eventos.descricao → eventos.local
   - eventos.local → eventos.cidade
```

## ⚡ Próximos Passos

1. ✅ Execute a migração
2. 🔄 Atualize o código da aplicação
3. 🧪 Teste todas as funcionalidades relacionadas a eventos
4. 📝 Atualize a documentação da API (se aplicável)
5. 🔄 Atualize scripts de scraping (se aplicável) 