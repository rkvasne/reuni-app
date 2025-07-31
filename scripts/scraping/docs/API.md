# 📡 Documentação da API

## Visão Geral

O sistema de scraping de eventos oferece uma API interna para interação com os dados coletados e configurações do sistema.

## Módulos Principais

### 1. Scrapers

#### EventbriteScraper
```javascript
const scraper = new EventbriteScraper();
await scraper.scrapeEvents('Ji-Paraná', 'RO');
```

**Métodos:**
- `scrapeEvents(city, state)` - Coleta eventos de uma cidade
- `scrapeEventDetails(eventUrl)` - Coleta detalhes de um evento específico
- `validateEvent(eventData)` - Valida dados do evento

#### SymplaScraper
```javascript
const scraper = new SymplaScraper();
await scraper.scrapeEvents('Ji-Paraná', 'RO');
```

**Métodos:**
- `scrapeEvents(city, state)` - Coleta eventos de uma cidade
- `scrapeEventDetails(eventUrl)` - Coleta detalhes de um evento específico
- `validateEvent(eventData)` - Valida dados do evento

### 2. Storage

#### SupabaseStorage
```javascript
const storage = new SupabaseStorage();
await storage.saveEvent(eventData);
```

**Métodos:**
- `saveEvent(eventData)` - Salva evento no banco
- `getEvents(filters)` - Busca eventos com filtros
- `updateEvent(id, data)` - Atualiza evento existente
- `deleteEvent(id)` - Remove evento

### 3. Processors

#### EventProcessor
```javascript
const processor = new EventProcessor();
const processedData = await processor.process(rawEventData);
```

**Métodos:**
- `process(rawData)` - Processa dados brutos
- `normalize(data)` - Normaliza formato dos dados
- `validate(data)` - Valida dados processados
- `enrich(data)` - Enriquece dados com informações adicionais

## Estrutura de Dados

### Evento
```javascript
{
  id: 'string',
  title: 'string',
  description: 'string',
  date: 'ISO 8601 string',
  location: {
    venue: 'string',
    address: 'string',
    city: 'string',
    state: 'string'
  },
  price: {
    min: 'number',
    max: 'number',
    currency: 'string'
  },
  category: 'string',
  source: 'eventbrite|sympla',
  url: 'string',
  image: 'string',
  organizer: 'string',
  created_at: 'ISO 8601 string',
  updated_at: 'ISO 8601 string'
}
```

## Rate Limiting

O sistema implementa rate limiting respeitoso:
- Eventbrite: 2-4 segundos entre requisições
- Sympla: 2-3.5 segundos entre requisições
- Configurável via variáveis de ambiente

## Tratamento de Erros

Todos os métodos podem lançar as seguintes exceções:
- `ScrapingError` - Erro durante scraping
- `ValidationError` - Erro de validação de dados
- `StorageError` - Erro de armazenamento
- `NetworkError` - Erro de rede/conectividade
