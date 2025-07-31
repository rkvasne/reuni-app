# Documento de Design - Sistema de Scraping de Eventos Brasil

## Visão Geral

O sistema será implementado como uma aplicação Node.js modular que utiliza Puppeteer para scraping dinâmico e Cheerio para parsing HTML. A arquitetura seguirá o padrão Strategy para diferentes scrapers, com sistema de autenticação, menu interativo via CLI e processamento inteligente de dados.

## Arquitetura

### Estrutura de Diretórios
```
scripts/
├── scraping/
│   ├── index.js                 # Ponto de entrada principal
│   ├── auth/
│   │   └── authenticator.js     # Sistema de autenticação
│   ├── cli/
│   │   └── interactive-menu.js  # Menu interativo
│   ├── scrapers/
│   │   ├── base-scraper.js      # Interface base para scrapers
│   │   ├── eventbrite-scraper.js
│   │   ├── sympla-scraper.js
│   │   └── scraper-factory.js   # Factory para criar scrapers
│   ├── processors/
│   │   ├── data-processor.js    # Processamento e validação
│   │   ├── category-classifier.js
│   │   └── date-parser.js
│   ├── storage/
│   │   └── database-handler.js  # Integração com banco
│   ├── utils/
│   │   ├── rate-limiter.js
│   │   ├── logger.js
│   │   └── config.js
│   └── reports/
│       └── report-generator.js
```

## Componentes e Interfaces

### 1. Sistema de Autenticação (auth/authenticator.js)

```javascript
class Authenticator {
  async authenticate() {
    // Solicita credenciais via prompt seguro
    // Valida credenciais contra hash armazenado
    // Retorna token de sessão
  }
  
  validateSession(token) {
    // Valida token de sessão
  }
}
```

### 2. Menu Interativo (cli/interactive-menu.js)

```javascript
class InteractiveMenu {
  async showMainMenu() {
    // Exibe opções: Eventbrite, Sympla, Regional, Configurações
  }
  
  async selectSources() {
    // Permite seleção múltipla de fontes
  }
  
  async configureRegion() {
    // Configuração específica para Ji-Paraná/RO
  }
}
```

### 3. Base Scraper (scrapers/base-scraper.js)

```javascript
abstract class BaseScraper {
  constructor(config) {
    this.config = config;
    this.rateLimiter = new RateLimiter(config.rateLimit);
  }
  
  abstract async scrapeEvents(filters);
  abstract async extractEventData(element);
  
  async validateEventData(eventData) {
    // Validação comum para todos os scrapers
  }
}
```

### 4. Eventbrite Scraper (scrapers/eventbrite-scraper.js)

```javascript
class EventbriteScaper extends BaseScraper {
  async scrapeEvents(filters) {
    // Navega para eventbrite.com.br
    // Aplica filtros de região (Ji-Paraná, RO)
    // Extrai eventos usando seletores específicos
    // Processa paginação
  }
  
  async extractEventData(element) {
    // Extrai: título, data, local, imagem, preço, descrição
    // Valida presença de imagem
    // Retorna objeto estruturado
  }
}
```

### 5. Sympla Scraper (scrapers/sympla-scraper.js)

```javascript
class SymplaScaper extends BaseScraper {
  async scrapeEvents(filters) {
    // Navega para sympla.com.br
    // Utiliza classe 'sympla-card' para identificar eventos
    // Aplica filtros regionais
    // Processa resultados
  }
  
  async extractEventData(element) {
    // Extrai dados específicos do Sympla
    // Adapta formato para padrão comum
  }
}
```

## Modelos de Dados

### Evento Coletado
```javascript
const EventSchema = {
  id: String,              // ID único gerado
  source: String,          // 'eventbrite' | 'sympla'
  title: String,           // Título do evento
  description: String,     // Descrição completa
  date: Date,             // Data/hora do evento
  location: {
    venue: String,         // Nome do local
    address: String,       // Endereço completo
    city: String,          // Cidade
    state: String,         // Estado (RO)
    coordinates: {         // Coordenadas geográficas
      lat: Number,
      lng: Number
    }
  },
  image: {
    url: String,           // URL da imagem
    alt: String            // Texto alternativo
  },
  price: {
    min: Number,           // Preço mínimo
    max: Number,           // Preço máximo
    currency: String       // 'BRL'
  },
  category: String,        // Categoria automaticamente classificada
  tags: [String],          // Tags extraídas
  organizer: String,       // Organizador do evento
  isRegional: Boolean,     // Se é evento regional (RO)
  scrapedAt: Date,         // Timestamp da coleta
  isValid: Boolean         // Se passou na validação
};
```

## Tratamento de Erros

### Estratégias de Recuperação
1. **Rate Limiting**: Implementação de backoff exponencial
2. **Timeout**: Timeout configurável por scraper
3. **Retry Logic**: Até 3 tentativas com delay crescente
4. **Fallback**: Continua com outras fontes se uma falhar
5. **Graceful Degradation**: Coleta parcial é melhor que falha total

### Tipos de Erro
```javascript
const ErrorTypes = {
  AUTHENTICATION_FAILED: 'auth_failed',
  RATE_LIMITED: 'rate_limited',
  NETWORK_ERROR: 'network_error',
  PARSING_ERROR: 'parsing_error',
  VALIDATION_ERROR: 'validation_error',
  SITE_STRUCTURE_CHANGED: 'structure_changed'
};
```

## Estratégia de Testes

### Testes Unitários
- Validação de dados extraídos
- Parsing de datas e preços
- Classificação de categorias
- Rate limiting

### Testes de Integração
- Scraping de páginas de teste
- Integração com banco de dados
- Fluxo completo de autenticação

### Testes E2E
- Execução completa do script
- Validação de dados no banco
- Geração de relatórios

## Configuração e Personalização

### Arquivo de Configuração (utils/config.js)
```javascript
const config = {
  scrapers: {
    eventbrite: {
      baseUrl: 'https://www.eventbrite.com.br',
      rateLimit: 2000, // ms entre requisições
      selectors: {
        eventCard: '.event-card',
        title: '.event-title',
        date: '.event-date',
        location: '.event-location',
        image: '.event-image img',
        price: '.event-price'
      },
      regions: {
        jiparana: {
          searchTerms: ['Ji-Paraná', 'Rondônia', 'RO'],
          nearbyCities: ['Ariquemes', 'Cacoal', 'Rolim de Moura', 'Vilhena']
        }
      }
    },
    sympla: {
      baseUrl: 'https://www.sympla.com.br',
      rateLimit: 1500,
      selectors: {
        eventCard: '.sympla-card',
        title: '.event-title',
        date: '.event-date',
        location: '.event-location',
        image: '.event-image img',
        price: '.event-price'
      }
    }
  },
  database: {
    connection: process.env.DATABASE_URL,
    tables: {
      events: 'events',
      scraping_logs: 'scraping_logs'
    }
  },
  authentication: {
    hashRounds: 12,
    sessionTimeout: 3600000 // 1 hora
  }
};
```

## Segurança e Ética

### Medidas de Segurança
1. **Credenciais**: Hash bcrypt para senhas
2. **Rate Limiting**: Respeito aos limites dos sites
3. **User-Agent**: Identificação apropriada
4. **Robots.txt**: Verificação antes do scraping
5. **SSL/TLS**: Conexões seguras obrigatórias

### Práticas Éticas
1. **Respeito aos ToS**: Verificação de termos de uso
2. **Caching**: Evitar requisições desnecessárias
3. **Atribuição**: Manter referência à fonte original
4. **Transparência**: Logs detalhados de todas as ações

## Performance e Escalabilidade

### Otimizações
1. **Concorrência Controlada**: Pool de workers limitado
2. **Caching Inteligente**: Cache de resultados por período
3. **Lazy Loading**: Carregamento sob demanda de scrapers
4. **Batch Processing**: Processamento em lotes

### Métricas de Performance
- Eventos coletados por minuto
- Taxa de sucesso por fonte
- Tempo médio de processamento
- Uso de memória e CPU