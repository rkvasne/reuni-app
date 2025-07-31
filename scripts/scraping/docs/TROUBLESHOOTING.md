# 🔧 Guia de Troubleshooting

## Problemas Comuns e Soluções

### 1. 🚫 Erro de Conexão com Supabase

**Sintomas:**
- Erro "Failed to connect to Supabase"
- Timeout em operações de banco
- Dados não são salvos

**Soluções:**
```bash
# Verificar credenciais
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY

# Testar conectividade
curl -I $SUPABASE_URL

# Verificar configuração
npm run check
```

### 2. 🕷️ Falhas no Scraping

**Sintomas:**
- "No events found" consistentemente
- Timeout em requisições
- Elementos não encontrados

**Soluções:**
```bash
# Aumentar rate limiting
EVENTBRITE_RATE_LIMIT=5000
SYMPLA_RATE_LIMIT=4000

# Executar em modo debug
LOG_LEVEL=debug npm start

# Testar com headless desabilitado
PUPPETEER_HEADLESS=false npm start
```

### 3. 💾 Problemas de Memória

**Sintomas:**
- "JavaScript heap out of memory"
- Sistema lento ou travando
- Processo sendo morto pelo OS

**Soluções:**
```bash
# Aumentar limite de memória Node.js
node --max-old-space-size=2048 index.js

# Reduzir concorrência
SCRAPING_MAX_CONCURRENCY=1

# Monitorar uso de memória
npm run monitor
```

## Comandos de Diagnóstico

### Verificação Completa do Sistema
```bash
npm run check
```

### Limpeza do Sistema
```bash
npm run clean
npm run reset
```
