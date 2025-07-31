/**
 * Testes para DataProcessor
 */

const { DataProcessor } = require('../processors/data-processor');

// Mock das dependências
jest.mock('../processors/date-parser');
jest.mock('../processors/category-classifier');

const { DateParser } = require('../processors/date-parser');
const { CategoryClassifier } = require('../processors/category-classifier');

describe('DataProcessor', () => {
  let dataProcessor;
  let mockDateParser;
  let mockCategoryClassifier;

  beforeEach(() => {
    // Setup mocks
    mockDateParser = {
      parseDate: jest.fn(),
      formatToStandard: jest.fn(),
      isValidDate: jest.fn(),
      isFutureEvent: jest.fn(),
      daysDifference: jest.fn(),
      resetStats: jest.fn(),
      getStats: jest.fn(() => ({ successRate: '90%' }))
    };

    mockCategoryClassifier = {
      classifyEvent: jest.fn(),
      reset: jest.fn(),
      getStats: jest.fn(() => ({ totalClassifications: 10 }))
    };

    DateParser.mockImplementation(() => mockDateParser);
    CategoryClassifier.mockImplementation(() => mockCategoryClassifier);

    dataProcessor = new DataProcessor();
  });

  afterEach(() => {
    dataProcessor.resetStats();
    jest.clearAllMocks();
  });

  describe('processEventData', () => {
    test('deve processar evento válido com sucesso', async () => {
      const rawData = {
        title: 'Show de Rock Nacional',
        description: 'Grande show com bandas famosas',
        date: '15/03/2024',
        location: 'Teatro Municipal, São Paulo, SP',
        image: 'https://example.com/image.jpg',
        price: 'R$ 50,00'
      };

      // Setup mocks
      mockDateParser.parseDate.mockReturnValue(new Date('2024-03-15'));
      mockDateParser.formatToStandard.mockReturnValue('2024-03-15T00:00:00.000Z');
      mockDateParser.isValidDate.mockReturnValue(true);
      mockDateParser.isFutureEvent.mockReturnValue(true);
      mockDateParser.daysDifference.mockReturnValue(30);

      mockCategoryClassifier.classifyEvent.mockReturnValue({
        category: 'shows',
        confidence: 0.9,
        tags: ['rock', 'nacional']
      });

      const result = await dataProcessor.processEventData(rawData, 'eventbrite');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.title).toBe('Show de Rock Nacional');
      expect(result.data.category).toBe('shows');
      expect(result.data.source).toBe('eventbrite');
    });

    test('deve rejeitar evento com título muito curto', async () => {
      const rawData = {
        title: 'Show',
        description: 'Descrição válida',
        date: '15/03/2024',
        location: 'Local válido'
      };

      const result = await dataProcessor.processEventData(rawData, 'eventbrite');

      expect(result.success).toBe(false);
      expect(result.errors).toContain('title_too_short');
    });

    test('deve rejeitar evento sem campos obrigatórios', async () => {
      const rawData = {
        description: 'Apenas descrição'
      };

      const result = await dataProcessor.processEventData(rawData, 'eventbrite');

      expect(result.success).toBe(false);
      expect(result.errors).toContain('missing_title');
      expect(result.errors).toContain('missing_date');
      expect(result.errors).toContain('missing_location');
    });

    test('deve rejeitar evento com data inválida', async () => {
      const rawData = {
        title: 'Evento com Data Inválida',
        date: 'data inválida',
        location: 'Local válido'
      };

      mockDateParser.parseDate.mockReturnValue(null);

      const result = await dataProcessor.processEventData(rawData, 'eventbrite');

      expect(result.success).toBe(false);
      expect(result.errors).toContain('invalid_date');
    });

    test('deve rejeitar evento passado quando futureEventsOnly é true', async () => {
      const rawData = {
        title: 'Evento do Passado',
        date: '15/03/2020',
        location: 'Local válido'
      };

      mockDateParser.parseDate.mockReturnValue(new Date('2020-03-15'));
      mockDateParser.formatToStandard.mockReturnValue('2020-03-15T00:00:00.000Z');
      mockDateParser.isValidDate.mockReturnValue(true);
      mockDateParser.isFutureEvent.mockReturnValue(false);

      const result = await dataProcessor.processEventData(rawData, 'eventbrite');

      expect(result.success).toBe(false);
      expect(result.errors).toContain('past_event');
    });
  });

  describe('normalizeData', () => {
    test('deve normalizar dados básicos', async () => {
      const rawData = {
        title: '  Show de Rock  ',
        description: '  Descrição com espaços  ',
        date: '15/03/2024',
        location: 'Teatro Municipal'
      };

      const result = await dataProcessor.normalizeData(rawData, 'eventbrite');

      expect(result.title).toBe('Show de Rock');
      expect(result.description).toBe('Descrição com espaços');
      expect(result.source).toBe('eventbrite');
      expect(result.scrapedAt).toBeDefined();
    });
  });

  describe('normalizeTitle', () => {
    test('deve normalizar título removendo espaços extras', () => {
      const title = '  Show   de   Rock  ';
      
      const result = dataProcessor.normalizeTitle(title);
      
      expect(result).toBe('Show de Rock');
    });

    test('deve limitar tamanho do título', () => {
      const longTitle = 'A'.repeat(300);
      
      const result = dataProcessor.normalizeTitle(longTitle);
      
      expect(result.length).toBeLessThanOrEqual(200);
    });

    test('deve retornar null para título vazio', () => {
      expect(dataProcessor.normalizeTitle('')).toBeNull();
      expect(dataProcessor.normalizeTitle(null)).toBeNull();
    });
  });

  describe('normalizeDate', () => {
    test('deve normalizar data válida', () => {
      const date = new Date('2024-03-15');
      mockDateParser.formatToStandard.mockReturnValue('2024-03-15T00:00:00.000Z');
      
      const result = dataProcessor.normalizeDate(date);
      
      expect(result).toBe('2024-03-15T00:00:00.000Z');
    });

    test('deve parsear string de data', () => {
      mockDateParser.parseDate.mockReturnValue(new Date('2024-03-15'));
      mockDateParser.formatToStandard.mockReturnValue('2024-03-15T00:00:00.000Z');
      
      const result = dataProcessor.normalizeDate('15/03/2024');
      
      expect(mockDateParser.parseDate).toHaveBeenCalledWith('15/03/2024');
      expect(result).toBe('2024-03-15T00:00:00.000Z');
    });

    test('deve retornar null para entrada inválida', () => {
      const result = dataProcessor.normalizeDate(null);
      
      expect(result).toBeNull();
    });
  });

  describe('normalizeLocation', () => {
    test('deve normalizar string de localização', () => {
      const location = 'Teatro Municipal, São Paulo, SP';
      
      const result = dataProcessor.normalizeLocation(location);
      
      expect(result).toHaveProperty('venue', 'Teatro Municipal, São Paulo, SP');
      expect(result).toHaveProperty('address', 'Teatro Municipal, São Paulo, SP');
    });

    test('deve normalizar objeto de localização', () => {
      const location = {
        venue: 'Teatro Municipal',
        address: 'Rua das Flores, 123',
        city: 'São Paulo',
        state: 'SP'
      };
      
      const result = dataProcessor.normalizeLocation(location);
      
      expect(result.venue).toBe('Teatro Municipal');
      expect(result.city).toBe('São Paulo');
      expect(result.state).toBe('SP');
    });
  });

  describe('normalizeImage', () => {
    test('deve normalizar URL de imagem', () => {
      const imageUrl = 'https://example.com/image.jpg';
      
      const result = dataProcessor.normalizeImage(imageUrl);
      
      expect(result).toHaveProperty('url', 'https://example.com/image.jpg');
      expect(result).toHaveProperty('alt', null);
    });

    test('deve normalizar objeto de imagem', () => {
      const image = {
        url: 'https://example.com/image.jpg',
        alt: 'Imagem do evento',
        width: 800,
        height: 600
      };
      
      const result = dataProcessor.normalizeImage(image);
      
      expect(result.url).toBe('https://example.com/image.jpg');
      expect(result.alt).toBe('Imagem do evento');
      expect(result.width).toBe(800);
    });

    test('deve garantir HTTPS em URLs', () => {
      const httpUrl = 'http://example.com/image.jpg';
      
      const result = dataProcessor.normalizeImage(httpUrl);
      
      expect(result.url).toBe('https://example.com/image.jpg');
    });
  });

  describe('normalizePrice', () => {
    test('deve normalizar preço gratuito', () => {
      const result = dataProcessor.normalizePrice('Gratuito');
      
      expect(result).toHaveProperty('min', 0);
      expect(result).toHaveProperty('max', 0);
      expect(result).toHaveProperty('isFree', true);
      expect(result).toHaveProperty('display', 'Gratuito');
    });

    test('deve normalizar preço com valor', () => {
      const result = dataProcessor.normalizePrice('R$ 50,00');
      
      expect(result).toHaveProperty('min', 50);
      expect(result).toHaveProperty('max', 50);
      expect(result).toHaveProperty('isFree', false);
      expect(result).toHaveProperty('currency', 'BRL');
    });

    test('deve normalizar faixa de preços', () => {
      const result = dataProcessor.normalizePrice('R$ 30,00 a R$ 80,00');
      
      expect(result.min).toBe(30);
      expect(result.max).toBe(80);
    });

    test('deve normalizar objeto de preço', () => {
      const price = {
        min: 25,
        max: 50,
        currency: 'BRL',
        isFree: false
      };
      
      const result = dataProcessor.normalizePrice(price);
      
      expect(result.min).toBe(25);
      expect(result.max).toBe(50);
      expect(result.currency).toBe('BRL');
    });
  });

  describe('processEventsBatch', () => {
    test('deve processar múltiplos eventos', async () => {
      const events = [
        { title: 'Evento 1', date: '15/03/2024', location: 'Local 1' },
        { title: 'Evento 2', date: '16/03/2024', location: 'Local 2' }
      ];

      // Setup mocks para sucesso
      mockDateParser.parseDate.mockReturnValue(new Date('2024-03-15'));
      mockDateParser.formatToStandard.mockReturnValue('2024-03-15T00:00:00.000Z');
      mockDateParser.isValidDate.mockReturnValue(true);
      mockDateParser.isFutureEvent.mockReturnValue(true);
      mockDateParser.daysDifference.mockReturnValue(30);

      mockCategoryClassifier.classifyEvent.mockReturnValue({
        category: 'outros',
        confidence: 0.5,
        tags: []
      });

      const result = await dataProcessor.processEventsBatch(events, 'eventbrite');

      expect(result.successful).toHaveLength(2);
      expect(result.rejected).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('getStats', () => {
    test('deve retornar estatísticas completas', () => {
      const stats = dataProcessor.getStats();
      
      expect(stats).toHaveProperty('totalProcessed');
      expect(stats).toHaveProperty('successful');
      expect(stats).toHaveProperty('rejected');
      expect(stats).toHaveProperty('successRate');
      expect(stats).toHaveProperty('dateParserStats');
      expect(stats).toHaveProperty('categoryClassifierStats');
    });
  });

  describe('extractCityFromText', () => {
    test('deve extrair cidade conhecida do texto', () => {
      const text = 'Teatro Municipal de São Paulo';
      
      const result = dataProcessor.extractCityFromText(text);
      
      expect(result).toBe('São Paulo');
    });

    test('deve retornar null para cidade não encontrada', () => {
      const text = 'Local desconhecido';
      
      const result = dataProcessor.extractCityFromText(text);
      
      expect(result).toBeNull();
    });
  });

  describe('isRegionalCity', () => {
    test('deve identificar cidade regional', () => {
      const result = dataProcessor.isRegionalCity('Ji-Paraná');
      
      expect(result).toBe(true);
    });

    test('deve identificar cidade não regional', () => {
      const result = dataProcessor.isRegionalCity('São Paulo');
      
      expect(result).toBe(false);
    });
  });

  describe('calculateQualityScore', () => {
    test('deve calcular score de qualidade alto para evento completo', () => {
      const data = {
        title: 'Show de Rock Nacional Completo',
        date: '2024-03-15T00:00:00.000Z',
        location: { venue: 'Teatro Municipal' },
        image: { url: 'https://example.com/image.jpg' },
        description: 'Descrição detalhada do evento musical',
        url: 'https://example.com/evento'
      };

      mockDateParser.isValidDate.mockReturnValue(true);
      
      const score = dataProcessor.calculateQualityScore(data);
      
      expect(score).toBeGreaterThan(0.8);
    });

    test('deve calcular score baixo para evento incompleto', () => {
      const data = {
        title: 'Show'
      };
      
      const score = dataProcessor.calculateQualityScore(data);
      
      expect(score).toBeLessThan(0.5);
    });
  });

  describe('generateEventHash', () => {
    test('deve gerar hash consistente para mesmo evento', () => {
      const data = {
        title: 'Show de Rock',
        date: '2024-03-15T00:00:00.000Z',
        location: { venue: 'Teatro Municipal' }
      };
      
      const hash1 = dataProcessor.generateEventHash(data);
      const hash2 = dataProcessor.generateEventHash(data);
      
      expect(hash1).toBe(hash2);
      expect(typeof hash1).toBe('string');
    });

    test('deve gerar hashes diferentes para eventos diferentes', () => {
      const data1 = { title: 'Evento 1', date: '2024-03-15', location: { venue: 'Local 1' } };
      const data2 = { title: 'Evento 2', date: '2024-03-16', location: { venue: 'Local 2' } };
      
      const hash1 = dataProcessor.generateEventHash(data1);
      const hash2 = dataProcessor.generateEventHash(data2);
      
      expect(hash1).not.toBe(hash2);
    });
  });
});