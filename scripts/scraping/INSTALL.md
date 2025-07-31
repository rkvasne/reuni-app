# 🚀 Guia de Instalação - Sistema de Scraping de Eventos Brasil

Este guia fornece instruções passo a passo para instalar e configurar o sistema.

## 📋 Pré-requisitos

### 1. Node.js e npm
```bash
# Verificar versões instaladas
node --version  # Deve ser >= 18.0.0
npm --version   # Deve ser >= 8.0.0

# Se não tiver instalado, baixe em: https://nodejs.org/
```

### 2. Git (opcional, para desenvolvimento)
```bash
git --version
```

### 3. Conta no Supabase
- Acesse [supabase.com](https://supabase.com)
- Crie uma conta gratuita
- Crie um novo projeto

## 🛠️ Instalação

### Passo 1: Preparar o Ambiente

```bash
# Navegar para o diretório do projeto
cd scripts/scraping

# Instalar dependências
npm install
```

### Passo 2: Configurar Banco de Dados

1. **Acesse seu projeto no Supabase**
2. **Vá para Settings > API**
3. **Copie a URL e a chave anônima**
4. **Execute as queries SQL abaixo no SQL Editor:**

```sql
-- Tabela principal de eventos
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  date TIMESTAMPTZ,
  location_venue VARCHAR(200),
  location_address TEXT,
  location_city VARCHAR(100),
  location_state VARCHAR(2),
  location_coordinates JSONB,
  image_url TEXT,
  image_alt VARCHAR(200),
  price_min DECIMAL(10,2),
  price_max DECIMAL(10,2),
  price_currency VARCHAR(3) DEFAULT 'BRL',
  price_is_free BOOLEAN DEFAULT false,
  price_display VARCHAR(100),
  organizer_name VARCHAR(200),
  organizer_verified BOOLEAN DEFAULT false,
  url TEXT,
  source VARCHAR(50) NOT NULL,
  category VARCHAR(50),
  category_confidence DECIMAL(3,2),
  tags TEXT[],
  is_regional BOOLEAN DEFAULT false,
  search_term VARCHAR(100),
  popularity_score DECIMAL(3,2),
  quality_score DECIMAL(3,2),
  hash VARCHAR(50) UNIQUE,
  scraped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de logs de operações de scraping
CREATE TABLE scraping_logs (
  id SERIAL PRIMARY KEY,
  operation_type VARCHAR(50) NOT NULL,
  source VARCHAR(50),
  status VARCHAR(20) NOT NULL,
  events_found INTEGER DEFAULT 0,
  events_inserted INTEGER DEFAULT 0,
  events_duplicated INTEGER DEFAULT 0,
  events_rejected INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  duration_ms INTEGER,
  filters_used JSONB,
  error_details JSONB,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de categorias de eventos (opcional)
CREATE TABLE event_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  keywords TEXT[],
  priority INTEGER DEFAULT 1,
  color VARCHAR(7),
  icon VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de localizações (opcional)
CREATE TABLE event_locations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  coordinates JSONB,
  is_regional BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_source ON events(source);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_is_regional ON events(is_regional);
CREATE INDEX idx_events_hash ON events(hash);
CREATE INDEX idx_scraping_logs_started_at ON scraping_logs(started_at);
CREATE INDEX idx_scraping_logs_source ON scraping_logs(source);
```

### Passo 3: Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env.local

# Editar arquivo com suas configurações
# Use seu editor preferido (notepad, vim, code, etc.)
notepad .env.local
```

**Configure as seguintes variáveis obrigatórias:**

```env
# Substitua pelos valores do seu projeto Supabase
SUPABASE_URL=https://seu-projeto-id.supabase.co
SUPABASE_ANON_KEY=sua_chave_anonima_muito_longa_aqui
```

### Passo 4: Testar a Instalação

```bash
# Executar testes para verificar se tudo está funcionando
npm test

# Se todos os testes passarem, a instalação está correta
```

### Passo 5: Primeira Execução

```bash
# Executar o sistema pela primeira vez
npm start

# Siga as instruções na tela para:
# 1. Criar suas credenciais de acesso
# 2. Configurar o scraping
# 3. Executar a primeira coleta
```

## ⚙️ Configurações Avançadas

### Configurações de Performance

**Para máxima velocidade (use com cuidado):**
```env
SCRAPING_MAX_CONCURRENCY=3
EVENTBRITE_RATE_LIMIT=1000
SYMPLA_RATE_LIMIT=800
```

**Para máxima estabilidade:**
```env
SCRAPING_MAX_CONCURRENCY=1
EVENTBRITE_RATE_LIMIT=3000
SYMPLA_RATE_LIMIT=2500
```

### Configurações de Logging

**Para desenvolvimento:**
```env
LOG_LEVEL=debug
LOG_TO_FILE=true
```

**Para produção:**
```env
LOG_LEVEL=info
LOG_TO_FILE=true
```

### Configurações Regionais

**Para focar apenas em Ji-Paraná:**
```env
PRIMARY_REGION="Ji-Paraná"
PRIMARY_STATE="RO"
NEARBY_CITIES="Ariquemes,Cacoal"
```

**Para incluir mais cidades:**
```env
NEARBY_CITIES="Ariquemes,Cacoal,Rolim de Moura,Vilhena,Porto Velho,Guajará-Mirim"
```

## 🔧 Solução de Problemas

### Erro: "Cannot find module"
```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

### Erro: "Database connection failed"
```bash
# Verificar configurações do Supabase
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY

# Testar conexão manualmente no painel do Supabase
```

### Erro: "Permission denied"
```bash
# No Windows, executar como administrador
# No Linux/Mac:
sudo npm install
```

### Erro: "Puppeteer download failed"
```bash
# Instalar Puppeteer manualmente
npm install puppeteer --unsafe-perm=true --allow-root
```

### Erro: "Rate limited"
```bash
# Aumentar delays no .env.local
EVENTBRITE_RATE_LIMIT=5000
SYMPLA_RATE_LIMIT=4000
```

## 📊 Verificação da Instalação

### 1. Verificar Dependências
```bash
npm list --depth=0
```

### 2. Verificar Configuração
```bash
# Executar verificação de configuração
npm run check-config
```

### 3. Verificar Banco de Dados
```bash
# Executar teste de conexão
npm run test-db
```

### 4. Verificar Scrapers
```bash
# Executar teste de estrutura dos sites
npm run check-structure
```

## 🚀 Próximos Passos

Após a instalação bem-sucedida:

1. **Execute o sistema**: `npm start`
2. **Configure suas credenciais** na primeira execução
3. **Teste com scraping rápido** para verificar funcionamento
4. **Configure filtros personalizados** conforme necessário
5. **Agende execuções automáticas** (opcional)

## 📞 Suporte

Se encontrar problemas durante a instalação:

1. **Verifique os logs**: `logs/scraping-YYYY-MM-DD.log`
2. **Execute os testes**: `npm test`
3. **Consulte a documentação**: `README.md`
4. **Abra uma issue** no repositório

---

**Instalação concluída com sucesso! 🎉**