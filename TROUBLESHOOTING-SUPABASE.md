# 🔧 Troubleshooting - Supabase

## ❌ Erro 503 (Service Unavailable)

### 🔍 **Diagnóstico**
O erro 503 indica que o serviço Supabase está temporariamente indisponível.

### 🎯 **Causas Comuns**

1. **Projeto pausado por inatividade** (mais comum)
2. **Manutenção do Supabase**
3. **Limite de uso excedido**
4. **Problema temporário do servidor**
5. **Sobrecarga de requisições**

### 🚀 **Soluções**

#### 1. **Verificar Status do Projeto**
```bash
# Testar conectividade
node scripts/test-supabase.js

# Monitorar em tempo real
node scripts/monitor-supabase.js
```

#### 2. **Reativar Projeto Pausado**
1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Se estiver pausado, clique em "Resume Project"
4. Aguarde alguns minutos para reativação

#### 3. **Verificar Limites de Uso**
- Acesse "Settings" → "Usage" no dashboard
- Verifique se não excedeu os limites do plano
- Considere upgrade se necessário

#### 4. **Implementar Retry Automático**
```typescript
import { fetchEventosWithRetry } from '@/utils/supabaseRetry';

// Em vez de:
const { data, error } = await supabase.from('eventos').select('*');

// Use:
const { data, error } = await fetchEventosWithRetry();
```

## 🛠️ **Ferramentas de Diagnóstico**

### **Teste Rápido**
```bash
node scripts/test-supabase.js
```

### **Monitoramento Contínuo**
```bash
node scripts/monitor-supabase.js
```

### **Verificar Logs do Browser**
1. Abra DevTools (F12)
2. Vá para aba "Network"
3. Procure por requisições com status 503
4. Verifique detalhes do erro

## 🔄 **Sistema de Retry Implementado**

### **Componentes com Retry**
- ✅ `fetchEventosWithRetry()` - Busca eventos
- ✅ `fetchParticipacoesWithRetry()` - Busca participações
- ✅ `fetchEventoWithRetry()` - Busca evento específico
- ✅ `checkSupabaseHealth()` - Verifica conectividade

### **Configuração de Retry**
```typescript
{
  maxAttempts: 3,     // Máximo 3 tentativas
  delay: 1000,        // 1 segundo entre tentativas
  backoff: true       // Aumenta delay exponencialmente
}
```

## 📊 **Monitoramento de Status**

### **Hook de Status**
```typescript
import { useSupabaseStatus } from '@/hooks/useSupabaseStatus';

function MyComponent() {
  const { isOnline, error, retry } = useSupabaseStatus();
  
  if (!isOnline) {
    return <div>Offline: {error}</div>;
  }
  
  return <div>Online!</div>;
}
```

### **Componente de Status**
```typescript
import SupabaseStatus from '@/components/SupabaseStatus';

function App() {
  return (
    <SupabaseStatus>
      <YourApp />
    </SupabaseStatus>
  );
}
```

## 🚨 **Alertas e Notificações**

### **Erros que Requerem Atenção**
- ✅ 3+ erros consecutivos
- ✅ Tempo de resposta > 5 segundos
- ✅ Taxa de erro > 20%

### **Logs Automáticos**
- ✅ Timestamp de cada requisição
- ✅ Tempo de resposta
- ✅ Taxa de sucesso
- ✅ Detalhes do erro

## 🔗 **Links Úteis**

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Status Page](https://status.supabase.com/)
- [Documentação](https://supabase.com/docs)
- [Suporte](https://supabase.com/support)

## 📞 **Quando Buscar Ajuda**

1. **Erro persiste por > 30 minutos**
2. **Taxa de erro > 50%**
3. **Projeto não reativa após resume**
4. **Limites não foram excedidos mas ainda há erro**

---

## 🎯 **Próximos Passos**

1. Execute o teste: `node scripts/test-supabase.js`
2. Se offline, acesse o Supabase Dashboard
3. Reative o projeto se necessário
4. Implemente os componentes de retry
5. Configure monitoramento contínuo

**✨ Com essas ferramentas, você terá controle total sobre a conectividade!**