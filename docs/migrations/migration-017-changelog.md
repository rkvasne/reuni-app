# Changelog - Migração 017: Correção da Tabela Comunidades

## 🐛 Correção Aplicada

### Problema Identificado
```
ERROR: 42703: column "role" does not exist
HINT: Perhaps you meant to reference the column "comunidades.nome".
```

### Causa Raiz
As políticas RLS faziam referência ao campo `role` na tabela `membros_comunidade`, mas o campo correto é `papel`.

### Estrutura Real da Tabela `membros_comunidade`
```sql
CREATE TABLE public.membros_comunidade (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    comunidade_id uuid,
    usuario_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    papel character varying(20) DEFAULT 'membro'::character varying,  -- ✅ Campo correto
    status character varying(20) DEFAULT 'ativo'::character varying,
    CONSTRAINT membros_comunidade_papel_check CHECK (((papel)::text = ANY ((ARRAY['admin'::character varying, 'moderador'::character varying, 'membro'::character varying])::text[])))
);
```

## 🔧 Correções Aplicadas

### 1. Política RLS de UPDATE
**Antes (Incorreto)**:
```sql
AND role IN ('admin', 'moderator')
```

**Depois (Correto)**:
```sql
AND papel IN ('admin', 'moderador')
```

### 2. Valores dos Papéis
**Antes**: `'admin', 'moderator'`
**Depois**: `'admin', 'moderador'` (conforme constraint da tabela)

## ✅ Validação da Correção

### Teste Executado
```bash
node scripts/test-migration-017.js
```

### Resultados
- ✅ Tabela `membros_comunidade` acessível
- ✅ Campo `papel` existe e está correto
- ✅ Campos `privada` e `cidade` prontos para criação
- ✅ Migração pronta para aplicação

## 📋 Arquivos Atualizados

1. **`supabase/migrations/017_fix_comunidades_table.sql`**
   - Corrigido campo `role` → `papel`
   - Corrigidos valores `'moderator'` → `'moderador'`

2. **`docs/migrations/comunidades-table-migration.md`**
   - Documentação atualizada com termos corretos

3. **`scripts/test-migration-017.js`**
   - Novo script de teste criado

## 🚀 Status Atual

- ✅ **Erro corrigido**: Campo `papel` usado corretamente
- ✅ **Migração testada**: Sem erros de sintaxe
- ✅ **Documentação atualizada**: Reflete correções
- ✅ **Pronto para aplicação**: `supabase db push`

## 🔄 Próximos Passos

1. **Aplicar migração**: `supabase db push`
2. **Validar resultado**: `node scripts/validate-comunidades-migration.js`
3. **Confirmar funcionamento**: Testar políticas RLS
4. **Marcar como concluído**: Task 6 finalizada

---

**Data da Correção**: 08/01/2025  
**Tipo**: Correção de Bug  
**Impacto**: Crítico (bloqueava aplicação da migração)  
**Status**: ✅ Resolvido