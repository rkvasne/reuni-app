# 🔧 Troubleshooting - Problemas Comuns

## 🖼️ **Erro: hostname not configured under images**

### **Sintoma**
```
Error: Invalid src prop (...supabase.co/...) on `next/image`, 
hostname "xxx.supabase.co" is not configured under images in your `next.config.js`
```

### **Solução**
1. ✅ **Já corrigido**: Domínio adicionado ao `next.config.js`
2. **REINICIE o servidor**: `Ctrl+C` → `npm run dev`
3. **Teste novamente**: Upload e visualização de imagens

---

## 🗄️ **Erro: max_participantes column not found**

### **Sintoma**
```
ERROR: column "max_participantes" of relation "eventos" does not exist
```

### **Solução**
1. Execute `FINAL_fix_events.sql` no Supabase Dashboard
2. Verifique se a migração foi aplicada com sucesso

---

## 📁 **Erro: bucket does not exist**

### **Sintoma**
```
ERROR: bucket "events" does not exist
```

### **Solução**
1. Execute `FINAL_setup_storage.sql` no Supabase Dashboard
2. Verifique se o Storage está habilitado no projeto

---

## 🔒 **Erro: RLS policy violation**

### **Sintoma**
```
ERROR: new row violates row-level security policy
```

### **Solução**
1. Execute `010_fix_rls_recursion.sql`
2. Ou para desenvolvimento: `011_disable_rls_temp.sql`

---

## 🔄 **Erro: infinite recursion detected**

### **Sintoma**
Consultas ficam lentas ou travam

### **Solução**
1. Execute `010_fix_rls_recursion.sql`
2. Reinicie a aplicação

---

## 📊 **Verificar se tudo está funcionando**

### **Teste rápido**
```sql
-- No SQL Editor do Supabase:
SELECT COUNT(*) FROM eventos;
SELECT COUNT(*) FROM participacoes;
SELECT * FROM storage.buckets WHERE id = 'events';
```

### **Teste completo**
1. Criar evento com imagem
2. Participar do evento
3. Verificar se imagem aparece
4. Verificar contadores

---

## 🆘 **Se nada funcionar**

### **Reset completo**
1. Execute `FINAL_fix_events.sql`
2. Execute `FINAL_setup_storage.sql` (se quiser upload)
3. Reinicie o servidor: `npm run dev`
4. Teste criação de evento

### **Ainda com problemas?**
- Verifique se está logado no sistema
- Verifique se o Supabase está conectado
- Verifique o console do navegador para erros

---

**Na dúvida, execute apenas os arquivos FINAL_* e reinicie o servidor!** 🚀