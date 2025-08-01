/**
 * Configuração Centralizada
 * 
 * Configurações para todos os scrapers, incluindo
 * seletores CSS, rate limits e configurações regionais.
 * 
 * FOCO: Ji-Paraná/RO + Artistas Famosos do Brasil
 * POLÍTICA: Apenas eventos reais, sem dados fictícios
 */

const path = require('path');

// Carregar variáveis de ambiente
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Função para obter configuração de variável de ambiente com fallback
function getEnvConfig(key, defaultValue, type = 'string') {
  const value = process.env[key];
  if (!value) return defaultValue;
  
  switch (type) {
    case 'number':
      return parseInt(value, 10) || defaultValue;
    case 'boolean':
      return value.toLowerCase() === 'true';
    case 'array':
      return value.split(',').map(item => item.trim());
    default:
      return value;
  }
}

const config = {
  scrapers: {
    eventbrite: {
      name: 'Eventbrite Brasil',
      baseUrl: 'https://www.eventbrite.com.br',
      searchUrl: 'https://www.eventbrite.com.br/d/brazil--ji-paran%C3%A1/events/',
      rateLimit: getEnvConfig('EVENTBRITE_RATE_LIMIT', 2000, 'number'),
      timeout: 30000,
      enabled: true,
      
      // Seletores CSS específicos do Eventbrite
      selectors: {
        eventCard: '[data-testid="event-card"], .event-card, .search-event-card',
        title: '[data-testid="event-title"], .event-title, h3 a, .event-card__title',
        date: '[data-testid="event-date"], .event-date, .date-info, .event-card__date',
        location: '[data-testid="event-location"], .event-location, .venue-info, .event-card__location',
        image: '[data-testid="event-image"] img, .event-image img, .event-card__image img',
        price: '[data-testid="event-price"], .event-price, .price-info, .event-card__price',
        description: '[data-testid="event-description"], .event-description, .event-summary',
        organizer: '.organizer-name, .event-organizer',
        category: '.event-category, .category-tag'
      },
      
      // Configurações regionais específicas
      regions: {
        jiparana: {
          name: 'Ji-Paraná e Região',
          searchTerms: ['Ji-Paraná', 'Rondônia', 'RO', 'Ji Parana'],
          nearbyCities: ['Ariquemes', 'Cacoal', 'Rolim de Moura', 'Vilhena', 'Porto Velho'],
          coordinates: {
            lat: -10.8756,
            lng: -61.9378,
            radius: 200 // km
          },
          priority: 1
        },
        nacional: {
          name: 'Artistas Famosos Brasil',
          searchTerms: ['Brasil', 'São Paulo', 'Rio de Janeiro', 'Brasília'],
          keywords: ['show nacional', 'turnê', 'festival', 'artista famoso'],
          priority: 2
        }
      },
      
      // Filtros de qualidade
      qualityFilters: {
        requireImage: true,
        requireDescription: true,
        minTitleLength: 10,
        maxTitleLength: 200,
        requireValidDate: true,
        requireLocation: true
      }
    },
    
    sympla: {
      name: 'Sympla Brasil',
      baseUrl: 'https://www.sympla.com.br',
      searchUrl: 'https://www.sympla.com.br/eventos/ji-parana-ro',
      rateLimit: getEnvConfig('SYMPLA_RATE_LIMIT', 1500, 'number'),
      timeout: 30000,
      enabled: true,
      
      // Seletores CSS específicos do Sympla
      selectors: {
        eventCard: '.sympla-card, .event-item, .EventCardstyles__Container, [data-testid="event-card"]',
        title: '.sympla-card__title, .event-title, .EventCardstyles__Title, [data-testid="event-title"]',
        date: '.sympla-card__date, .event-date, .EventCardstyles__Date, [data-testid="event-date"]',
        location: '.sympla-card__location, .event-location, .EventCardstyles__Location, [data-testid="event-location"]',
        image: '.sympla-card__image img, .event-image img, .EventCardstyles__Image img, [data-testid="event-image"] img',
        price: '.sympla-card__price, .event-price, .EventCardstyles__Price, [data-testid="event-price"]',
        description: '.sympla-card__description, .event-description, [data-testid="event-description"]',
        organizer: '.event-organizer, .organizer-name, [data-testid="event-organizer"]',
        category: '.event-category, .category-name, [data-testid="event-category"]'
      },
      
      // Regiões prioritárias - Rondônia e capitais
      regions: {
        rondonia: {
          name: 'Rondônia - Cidades Principais',
          searchTerms: ['Ji-Paraná', 'Porto Velho', 'Ariquemes', 'Cacoal', 'Vilhena', 'Rolim de Moura', 'Jaru', 'Ouro Preto do Oeste', 'Guajará-Mirim', 'Pimenta Bueno'],
          nearbyCities: ['Ji-Paraná', 'Porto Velho', 'Ariquemes', 'Cacoal', 'Vilhena', 'Rolim de Moura', 'Jaru', 'Ouro Preto do Oeste', 'Guajará-Mirim', 'Pimenta Bueno'],
          priority: 1,
          maxEvents: 20
        },
        capitais: {
          name: 'Capitais Brasileiras',
          searchTerms: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte', 'Manaus', 'Curitiba', 'Recife', 'Goiânia', 'Belém', 'Porto Alegre'],
          keywords: ['show', 'festival', 'artista', 'evento', 'apresentação'],
          priority: 2,
          maxEvents: 15
        },
        nacional: {
          name: 'Eventos Nacionais',
          searchTerms: ['Brasil', 'nacional', 'turnê', 'tour'],
          keywords: ['show nacional', 'turnê', 'festival', 'artista famoso'],
          priority: 3,
          maxEvents: 10
        }
      },
      
      // Filtros de qualidade melhorados
      qualityFilters: {
        requireImage: false, // Sympla nem sempre tem imagens
        requireDescription: false, // Sympla às vezes não tem descrição completa
        minTitleLength: 8,
        maxTitleLength: 150,
        requireValidDate: true,
        requireLocation: true,
        // Filtros de relevância
        excludeKeywords: [
          'teste', 'test', 'exemplo', 'example', 'placeholder', 'lorem ipsum',
          'evento teste', 'evento exemplo', 'show teste', 'apresentação teste',
          'workshop teste', 'curso teste', 'palestra teste'
        ],
        // Palavras que indicam eventos reais
        includeKeywords: [
          'show', 'festival', 'apresentação', 'workshop', 'curso', 'palestra',
          'conferência', 'seminário', 'encontro', 'reunião', 'comemoração',
          'celebração', 'inauguração', 'lançamento', 'exposição', 'feira'
        ]
      }
    }
  },
  
  // Configurações do banco de dados
  database: {
    connection: getEnvConfig('DATABASE_URL', '') || getEnvConfig('SUPABASE_URL', ''),
    apiKey: getEnvConfig('SUPABASE_ANON_KEY', ''),
    tables: {
      events: 'events',
      scraping_logs: 'scraping_logs',
      categories: 'event_categories',
      locations: 'event_locations'
    },
    batchSize: 50, // Inserções em lote
    maxConnections: 5
  },
  
  // Configurações de autenticação
  authentication: {
    hashRounds: getEnvConfig('AUTH_HASH_ROUNDS', 12, 'number'),
    sessionTimeout: getEnvConfig('AUTH_SESSION_TIMEOUT', 3600000, 'number'), // 1 hora
    maxAttempts: 3,
    lockoutTime: 300000 // 5 minutos
  },
  
  // Configurações gerais de scraping
  scraping: {
    maxRetries: getEnvConfig('SCRAPING_MAX_RETRIES', 3, 'number'),
    timeout: getEnvConfig('SCRAPING_TIMEOUT', 30000, 'number'),
    userAgent: getEnvConfig('SCRAPING_USER_AGENT', 
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ),
    maxConcurrency: getEnvConfig('SCRAPING_MAX_CONCURRENCY', 2, 'number'), // Reduzido para ser mais respeitoso
    delayBetweenRequests: 1000, // ms mínimo entre requisições
    respectRobotsTxt: true,
    
    // Headers padrão para requisições
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    },
    
    // Configurações do Puppeteer
    puppeteer: {
      headless: getEnvConfig('PUPPETEER_HEADLESS', true, 'boolean'),
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
      defaultViewport: {
        width: 1366,
        height: 768
      }
    }
  },
  
  // Configurações de categorização automática
  categories: {
    shows: {
      name: 'Shows e Música',
      keywords: [
        'show', 'música', 'concert', 'banda', 'cantor', 'cantora', 'festival', 
        'rock', 'pop', 'sertanejo', 'funk', 'rap', 'eletrônica', 'jazz', 
        'blues', 'reggae', 'forró', 'pagode', 'samba', 'mpb', 'turnê',
        'artista', 'musical', 'live', 'apresentação'
      ],
      priority: 1,
      color: '#FF6B6B',
      icon: '🎵'
    },
    teatro: {
      name: 'Teatro e Artes Cênicas',
      keywords: [
        'teatro', 'peça', 'espetáculo', 'drama', 'comédia', 'musical', 
        'ópera', 'dança', 'ballet', 'circo', 'stand-up', 'monólogo',
        'improviso', 'performance', 'arte cênica'
      ],
      priority: 2,
      color: '#4ECDC4',
      icon: '🎭'
    },
    esportes: {
      name: 'Esportes e Competições',
      keywords: [
        'futebol', 'basquete', 'vôlei', 'corrida', 'maratona', 'campeonato', 
        'torneio', 'copa', 'liga', 'jogo', 'partida', 'competição',
        'atletismo', 'natação', 'ciclismo', 'triathlon', 'crossfit'
      ],
      priority: 3,
      color: '#45B7D1',
      icon: '⚽'
    },
    gastronomia: {
      name: 'Gastronomia e Culinária',
      keywords: [
        'festival', 'culinária', 'gastronomia', 'food', 'comida', 'degustação', 
        'chef', 'restaurante', 'cerveja', 'vinho', 'churrasco', 'barbecue',
        'street food', 'food truck', 'cozinha', 'sabor'
      ],
      priority: 4,
      color: '#F7DC6F',
      icon: '🍽️'
    },
    educacao: {
      name: 'Educação e Desenvolvimento',
      keywords: [
        'curso', 'workshop', 'palestra', 'seminário', 'conferência', 'treinamento',
        'capacitação', 'aula', 'masterclass', 'webinar', 'mentoria',
        'coaching', 'desenvolvimento', 'aprendizado', 'conhecimento'
      ],
      priority: 5,
      color: '#BB8FCE',
      icon: '📚'
    },
    tecnologia: {
      name: 'Tecnologia e Inovação',
      keywords: [
        'tech', 'tecnologia', 'programação', 'desenvolvimento', 'software',
        'hackathon', 'startup', 'inovação', 'digital', 'ia', 'inteligência artificial',
        'blockchain', 'meetup', 'dev', 'coding'
      ],
      priority: 6,
      color: '#85C1E9',
      icon: '💻'
    },
    infantil: {
      name: 'Eventos Infantis',
      keywords: [
        'infantil', 'criança', 'família', 'kids', 'teatro infantil',
        'show infantil', 'parque', 'diversão', 'brinquedo', 'educativo',
        'recreação', 'animação'
      ],
      priority: 7,
      color: '#F8C471',
      icon: '🎪'
    },
    outros: {
      name: 'Outros Eventos',
      keywords: [],
      priority: 99,
      color: '#AEB6BF',
      icon: '📅'
    }
  },
  
  // Configurações de logging
  logging: {
    level: getEnvConfig('LOG_LEVEL', 'info'),
    toFile: getEnvConfig('LOG_TO_FILE', false, 'boolean'),
    directory: path.join(__dirname, '../logs'),
    maxFileSize: '10MB',
    maxFiles: 5,
    datePattern: 'YYYY-MM-DD'
  },
  
  // Configurações de relatórios
  reports: {
    directory: path.join(__dirname, '../reports'),
    formats: ['json', 'csv', 'html'],
    includeCharts: true,
    autoGenerate: true
  },
  
  // Configurações regionais específicas
  regions: {
    primary: {
      name: getEnvConfig('PRIMARY_REGION', 'Ji-Paraná'),
      state: getEnvConfig('PRIMARY_STATE', 'RO'),
      coordinates: {
        lat: -10.8756,
        lng: -61.9378
      }
    },
    nearby: getEnvConfig('NEARBY_CITIES', 'Ariquemes,Cacoal,Rolim de Moura,Vilhena', 'array'),
    searchRadius: 200 // km
  },
  
  // Configurações de validação de dados
  validation: {
    event: {
      requiredFields: ['title', 'date', 'location'],
      optionalFields: ['description', 'price', 'image', 'organizer'],
      titleMinLength: 5,
      titleMaxLength: 200,
      descriptionMaxLength: 2000,
      futureEventsOnly: true,
      maxDaysInFuture: 365
    }
  }
};

// Validação básica da configuração
function validateConfig() {
  const errors = [];
  
  if (!config.database.connection) {
    errors.push('DATABASE_URL ou SUPABASE_URL não configurado');
  }
  
  if (!config.scrapers.eventbrite.enabled && !config.scrapers.sympla.enabled) {
    errors.push('Pelo menos um scraper deve estar habilitado');
  }
  
  if (errors.length > 0) {
    console.error('❌ Erros de configuração:', errors);
    throw new Error(`Configuração inválida: ${errors.join(', ')}`);
  }
}

// Valida configuração ao carregar (exceto em testes)
if (process.env.NODE_ENV !== 'test') {
  validateConfig();
}

module.exports = config;