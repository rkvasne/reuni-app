# 🚀 Como Usar - Reuni v0.0.5

## 📋 Passo a Passo Simples

### 1. **Execute a migração obrigatória**
```sql
-- No SQL Editor do Supabase Dashboard:
-- Copie e cole o conteúdo de: supabase/migrations/011_FINAL_fix_events.sql
-- (Erros de sintaxe foram CORRIGIDOS)
```

### 2. **[OPCIONAL] Se quiser upload de imagens**
```sql
-- No SQL Editor do Supabase Dashboard:
-- Copie e cole o conteúdo de: supabase/migrations/012_FINAL_setup_storage.sql
-- (Erros de sintaxe foram CORRIGIDOS)
```

### 3. **Teste o sistema**
- Crie uma comunidade
- Crie um evento (agora com campo "max participantes")
- Se configurou storage: teste upload de imagem
- Participe de eventos

## ✅ O que funciona agora
- ✅ Comunidades completas
- ✅ Eventos com max_participantes
- ✅ Sistema de participação
- ✅ Upload de imagens (se configurado)
- ✅ Busca e perfis

## 📁 Arquivos importantes
- `supabase/migrations/011_FINAL_fix_events.sql` - **OBRIGATÓRIO**
- `supabase/migrations/012_FINAL_setup_storage.sql` - Opcional
- `README_STATUS.md` - Status atual
- `CHANGELOG.md` - Histórico de mudanças

## 🎯 Próximo: v0.0.6
- Sistema de moderação
- Posts em comunidades
- Notificações

---
**Simples assim!** 🎉