# 📁 Migrações do Banco de Dados

## 🎯 **ARQUIVOS ESSENCIAIS (Use apenas estes)**

### **OBRIGATÓRIO**
- `FINAL_fix_events.sql` - **Execute SEMPRE** - Corrige eventos e participações

### **OPCIONAL**
- `FINAL_setup_storage.sql` - Execute se quiser upload de imagens

---

## 🏘️ **Sistema de Comunidades (Opcional)**

Se quiser o sistema completo de comunidades:

### **Base**
- `001_initial_communities_migration.sql` - Cria tabelas de comunidades
- `003_triggers_and_functions.sql` - Triggers para contadores

### **Correções**
- `009_fix_admins.sql` - Adiciona criadores como admins
- `010_fix_rls_recursion.sql` - Corrige problemas de RLS
- `011_disable_rls_temp.sql` - Desabilita RLS (apenas desenvolvimento)

---

## 🚀 **Como Usar**

### **Mínimo (apenas eventos)**
```sql
-- Execute no SQL Editor do Supabase:
FINAL_fix_events.sql
```

### **Com upload de imagens**
```sql
-- Execute no SQL Editor do Supabase:
FINAL_fix_events.sql
FINAL_setup_storage.sql
```

### **Sistema completo**
```sql
-- Execute na ordem:
001_initial_communities_migration.sql
003_triggers_and_functions.sql
009_fix_admins.sql
010_fix_rls_recursion.sql
FINAL_fix_events.sql
```

---

## ⚠️ **Problemas Comuns**

### **Erro: "max_participantes column not found"**
- **Solução**: Execute `FINAL_fix_events.sql`

### **Erro: "bucket does not exist"**
- **Solução**: Execute `FINAL_setup_storage.sql`

### **Erro: "infinite recursion detected"**
- **Solução**: Execute `010_fix_rls_recursion.sql`

### **Comunidades sem admin**
- **Solução**: Execute `009_fix_admins.sql`

---

## 📊 **Status dos Arquivos**

| Arquivo | Status | Descrição |
|---------|--------|-----------|
| `FINAL_fix_events.sql` | ✅ **OBRIGATÓRIO** | Corrige eventos |
| `FINAL_setup_storage.sql` | ✅ Opcional | Upload de imagens |
| `001_initial_communities_migration.sql` | ✅ Estável | Base comunidades |
| `003_triggers_and_functions.sql` | ✅ Estável | Triggers |
| `009_fix_admins.sql` | ✅ Estável | Correção admins |
| `010_fix_rls_recursion.sql` | ✅ Estável | Correção RLS |
| `011_disable_rls_temp.sql` | ⚠️ Dev Only | Desabilita RLS |

---

## 🎯 **Recomendação**

**Para a maioria dos casos**: Execute apenas `FINAL_fix_events.sql`  
**Para upload**: Adicione `FINAL_setup_storage.sql`  
**Para comunidades**: Execute o sistema completo  

---

**Simples assim!** 🚀