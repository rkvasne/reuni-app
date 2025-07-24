# 📁 Migrações do Banco de Dados

## 🎯 **ARQUIVOS ESSENCIAIS (Use apenas estes)**

### **OBRIGATÓRIO**
- `011_FINAL_fix_events.sql` - **Execute SEMPRE** - Corrige eventos e participações

### **OPCIONAL**
- `012_FINAL_setup_storage.sql` - Execute se quiser upload de imagens

---

## 🏘️ **Sistema de Comunidades (Opcional)**

Se quiser o sistema completo de comunidades:

### **Base**
- `001_initial_communities_migration.sql` - Cria tabelas de comunidades
- `003_triggers_and_functions.sql` - Triggers para contadores

### **Correções**
- `008_fix_admins.sql` - Adiciona criadores como admins
- `009_fix_rls_recursion.sql` - Corrige problemas de RLS
- `010_disable_rls_temp.sql` - Desabilita RLS (apenas desenvolvimento)

---

## 🚀 **Como Usar**

### **Mínimo (apenas eventos)**
```sql
-- Execute no SQL Editor do Supabase:
011_FINAL_fix_events.sql
```

### **Com upload de imagens**
```sql
-- Execute no SQL Editor do Supabase:
011_FINAL_fix_events.sql
012_FINAL_setup_storage.sql
```

### **Sistema completo**
```sql
-- Execute na ordem:
001_initial_communities_migration.sql
003_triggers_and_functions.sql
008_fix_admins.sql
009_fix_rls_recursion.sql
011_FINAL_fix_events.sql
```

---

## ⚠️ **Problemas Comuns**

### **Erro: "max_participantes column not found"**
- **Solução**: Execute `011_FINAL_fix_events.sql`

### **Erro: "bucket does not exist"**
- **Solução**: Execute `012_FINAL_setup_storage.sql`

### **Erro: "infinite recursion detected"**
- **Solução**: Execute `009_fix_rls_recursion.sql`

### **Comunidades sem admin**
- **Solução**: Execute `008_fix_admins.sql`

---

## 📊 **Status dos Arquivos**

| Arquivo | Status | Descrição |
|---------|--------|-----------|
| `001_initial_communities_migration.sql` | ✅ Estável | Base comunidades |
| `002_rls_policies_setup.sql` | ⚠️ Pode causar recursão | Políticas RLS |
| `003_triggers_and_functions.sql` | ✅ Estável | Triggers |
| `004_minimal_migration.sql` | ✅ Estável | Migração mínima |
| `005_quick_check.sql` | ✅ Verificação | Teste rápido |
| `006_posts_and_social.sql` | 🔄 Em desenvolvimento | Posts sociais |
| `007_simple_add_column.sql` | ✅ Estável | Adiciona colunas |
| `008_fix_admins.sql` | ✅ Estável | Correção admins |
| `009_fix_rls_recursion.sql` | ✅ Estável | Correção RLS |
| `010_disable_rls_temp.sql` | ⚠️ Dev Only | Desabilita RLS |
| `011_FINAL_fix_events.sql` | ✅ **OBRIGATÓRIO** | Corrige eventos |
| `012_FINAL_setup_storage.sql` | ✅ Opcional | Upload de imagens |

---

## 🎯 **Recomendação**

**Para a maioria dos casos**: Execute apenas `011_FINAL_fix_events.sql`  
**Para upload**: Adicione `012_FINAL_setup_storage.sql`  
**Para comunidades**: Execute o sistema completo  

---

**Numeração corrigida e em ordem cronológica!** 🚀