# ⚙️ Guia de Configuração

## Variáveis de Ambiente

### 🗄️ Banco de Dados
```bash
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_chave_anonima_aqui
```

### 🕷️ Configurações de Scraping
```bash
SCRAPING_MAX_RETRIES=3
SCRAPING_TIMEOUT=30000
SCRAPING_MAX_CONCURRENCY=2
SCRAPING_USER_AGENT="EventScraper/1.0"
```

### ⏱️ Rate Limiting
```bash
EVENTBRITE_RATE_LIMIT=2000
SYMPLA_RATE_LIMIT=2500
```

### 📝 Logging
```bash
LOG_LEVEL=info
LOG_TO_FILE=true
LOG_MAX_FILES=5
LOG_MAX_SIZE=5242880
```

### 🎯 Configurações Regionais
```bash
PRIMARY_REGION="Ji-Paraná"
PRIMARY_STATE="RO"
NEARBY_CITIES="Ariquemes,Cacoal,Rolim de Moura,Vilhena"
```
