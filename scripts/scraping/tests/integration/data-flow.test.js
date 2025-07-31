/**
 * Testes de Integração - Fluxo de Dados
 */

const { DataProcessor } = require('../../processors/data-processor');
const { DatabaseHandler } = require('../../storage/database-handler');
const { OperationLogger } = require('../../storage/operation-logger');

// Mock do Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: { id: 1, title: 'Test Event' },
            error: null
          }))
        }))
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          limit: jest.fn(() => Promise.resolve({
            data: [],
            error: null
          }))
        }))
      }))
    }))
  }))
}));

describe('Integração - Fluxo de Dados', () => {
  let dataProcessor;
  let dbHandler;
  let operationLogger;

  beforeEach(async () => {
    dataProcessor = new DataProcessor();
    dbHandler = new DatabaseHandler();
    operationLogger = new OperationLogger();

    // Mock da conexão do banco
    await dbHandler.connect();
  });

  afterEach(() => {
    dataProcessor.resetStats();
    dbHandler.resetStats();
  });

  describe('Processamento e Persistência', () => {
    test('deve processar e salvar evento válido', async () => {
      const rawEventData = {
        title: 'Show de Rock Nacional em Ji-Paraná',
        description: 'Grande show com bandas famosas do rock brasileiro',
        date: '15/03/2024 às 20:00',
        location: 'Teatro Municipal, Ji-Paraná, RO',
        image: 'https://example.com/show-rock.jpg',
        price: 'R$ 50,00',
        organizer: 'Produtora Musical',
        url: 'https://eventbrite.com.br/evento-123',
        source: 'eventbrite'
      };

      // Processa o evento
      const processResult = await dataProcessor.processEventData(rawEventData, 'eventbrite');

      expect(processResult.success).toBe(true);
      expect(processResult.data).toBeDefined();

      // Verifica dados processados
      const processedEvent = processResult.data;
      expect(processedEvent.title).toBe('Show de Rock Nacional em Ji-Paraná');
      expect(processedEvent.category).toBeDefined();
      expect(processedEvent.qualityScore).toBeGreaterThan(0);
      expect(processedEvent.hash).toBeDefined();
      expect(processedEvent.isRegional).toBe(true); // Ji-Paraná é regional

      // Salva no banco
      const saveResult = await dbHandler.insertEvent(processedEvent);

      expect(saveResult.success).toBe(true);
      expect(saveResult.eventId).toBeDefined();
    });

    test('deve rejeitar evento com dados insuficientes', async () => {
      const incompleteEventData = {
        title: 'Ev', // Título muito curto
        date: 'data inválida',
        // Sem localização
        source: 'eventbrite'
      };

      const processResult = await dataProcessor.processEventData(incompleteEventData, 'eventbrite');

      expect(processResult.success).toBe(false);
      expect(processResult.errors).toContain('title_too_short');
      expect(processResult.errors).toContain('missing_location');
    });

    test('deve processar lote de eventos mistos', async () => {
      const eventsBatch = [
        {
          title: 'Festival de Música Regional',
          description: 'Festival com artistas locais de Ji-Paraná',
          date: '20/03/2024',
          location: 'Parque da Cidade, Ji-Paraná, RO',
          image: 'https://example.com/festival.jpg',
          source: 'sympla'
        },
        {
          title: 'Show Nacional',
          description: 'Artista famoso em turnê nacional',
          date: '25/03/2024',
          location: 'Arena São Paulo, São Paulo, SP',
          image: 'https://example.com/show-nacional.jpg',
          source: 'eventbrite'
        },
        {
          title: 'Ev', // Evento inválido
          date: 'data inválida',
          source: 'eventbrite'
        }
      ];

      const processResults = await dataProcessor.processEventsBatch(eventsBatch, 'mixed');

      expect(processResults.successful).toHaveLength(2);
      expect(processResults.rejected).toHaveLength(1);

      // Verifica classificação regional
      const regionalEvent = processResults.successful.find(e => e.isRegional);
      const nationalEvent = processResults.successful.find(e => !e.isRegional);

      expect(regionalEvent).toBeDefined();
      expect(nationalEvent).toBeDefined();
      expect(regionalEvent.location.city).toBe('Ji-Paraná');
      expect(nationalEvent.location.city).toBe('São Paulo');
    });
  });

  describe('Classificação e Categorização', () => {
    test('deve classificar diferentes tipos de eventos', async () => {
      const events = [
        {
          title: 'Show de Rock Nacional',
          description: 'Banda famosa de rock brasileiro',
          date: '15/03/2024',
          location: 'Teatro Municipal',
          source: 'eventbrite'
        },
        {
          title: 'Peça Teatral Clássica',
          description: 'Espetáculo de teatro com atores renomados',
          date: '16/03/2024',
          location: 'Teatro Municipal',
          source: 'sympla'
        },
        {
          title: 'Campeonato de Futebol',
          description: 'Torneio regional de futebol amador',
          date: '17/03/2024',
          location: 'Estádio Municipal',
          source: 'eventbrite'
        },
        {
          title: 'Festival Gastronômico',
          description: 'Evento culinário com chefs locais',
          date: '18/03/2024',
          location: 'Praça Central',
          source: 'sympla'
        }
      ];

      const results = [];
      for (const event of events) {
        const result = await dataProcessor.processEventData(event, event.source);
        if (result.success) {
          results.push(result.data);
        }
      }

      expect(results).toHaveLength(4);

      const categories = results.map(r => r.category);
      expect(categories).toContain('shows');
      expect(categories).toContain('teatro');
      expect(categories).toContain('esportes');
      expect(categories).toContain('gastronomia');

      // Verifica confiança da classificação
      results.forEach(result => {
        expect(result.categoryConfidence).toBeGreaterThan(0);
        expect(result.tags).toBeDefined();
        expect(Array.isArray(result.tags)).toBe(true);
      });
    });
  });

  describe('Detecção de Duplicatas', () => {
    test('deve detectar evento duplicado', async () => {
      const eventData = {
        title: 'Show Único de Rock',
        description: 'Show especial e único',
        date: '15/03/2024',
        location: 'Teatro Municipal',
        source: 'eventbrite'
      };

      // Processa e salva primeiro evento
      const processResult1 = await dataProcessor.processEventData(eventData, 'eventbrite');
      expect(processResult1.success).toBe(true);

      const saveResult1 = await dbHandler.insertEvent(processResult1.data);
      expect(saveResult1.success).toBe(true);

      // Tenta salvar evento duplicado
      const processResult2 = await dataProcessor.processEventData(eventData, 'eventbrite');
      expect(processResult2.success).toBe(true);

      // Mock para simular duplicata detectada
      jest.spyOn(dbHandler, 'checkDuplicate').mockResolvedValue(true);

      const saveResult2 = await dbHandler.insertEvent(processResult2.data);
      expect(saveResult2.success).toBe(false);
      expect(saveResult2.reason).toBe('duplicate');
    });
  });

  describe('Logging de Operações', () => {
    test('deve registrar operação completa de processamento', async () => {
      const operationId = operationLogger.generateOperationId('test', 'data_processing');
      
      operationLogger.startOperation(operationId, 'data_processing', 'test', {
        totalEvents: 3
      });

      const events = [
        {
          title: 'Evento Válido 1',
          date: '15/03/2024',
          location: 'Local 1',
          source: 'eventbrite'
        },
        {
          title: 'Evento Válido 2',
          date: '16/03/2024',
          location: 'Local 2',
          source: 'sympla'
        },
        {
          title: 'Ev', // Inválido
          date: 'data inválida',
          source: 'eventbrite'
        }
      ];

      let successful = 0;
      let rejected = 0;

      for (const event of events) {
        try {
          const result = await dataProcessor.processEventData(event, event.source);
          
          if (result.success) {
            successful++;
            operationLogger.recordEventInserted(operationId);
          } else {
            rejected++;
            operationLogger.recordEventRejected(operationId, result.errors[0]);
          }
        } catch (error) {
          operationLogger.recordError(operationId, error);
        }
      }

      const completedOperation = await operationLogger.completeOperation(operationId, {
        eventsProcessed: events.length,
        eventsInserted: successful,
        eventsRejected: rejected
      });

      expect(completedOperation.status).toBe('completed');
      expect(completedOperation.eventsInserted).toBe(2);
      expect(completedOperation.eventsRejected).toBe(1);
    });
  });

  describe('Qualidade de Dados', () => {
    test('deve calcular scores de qualidade apropriados', async () => {
      const highQualityEvent = {
        title: 'Show Completo de Rock Nacional com Banda Famosa',
        description: 'Descrição detalhada do evento musical com informações sobre a banda, local, horário e outras informações relevantes para o público interessado',
        date: '15/03/2024 às 20:00',
        location: 'Teatro Municipal Completo, Ji-Paraná, RO',
        image: 'https://example.com/high-quality-image.jpg',
        price: 'R$ 50,00',
        organizer: 'Produtora Musical Renomada',
        url: 'https://eventbrite.com.br/evento-completo-123',
        source: 'eventbrite'
      };

      const lowQualityEvent = {
        title: 'Show',
        date: '16/03/2024',
        location: 'Local',
        source: 'eventbrite'
      };

      const highQualityResult = await dataProcessor.processEventData(highQualityEvent, 'eventbrite');
      const lowQualityResult = await dataProcessor.processEventData(lowQualityEvent, 'eventbrite');

      expect(highQualityResult.success).toBe(true);
      expect(lowQualityResult.success).toBe(false); // Título muito curto

      if (highQualityResult.success) {
        expect(highQualityResult.data.qualityScore).toBeGreaterThan(0.8);
      }
    });
  });

  describe('Processamento Regional vs Nacional', () => {
    test('deve identificar corretamente eventos regionais e nacionais', async () => {
      const regionalEvent = {
        title: 'Festival Regional de Ji-Paraná',
        description: 'Evento local com artistas da região',
        date: '15/03/2024',
        location: 'Centro Cultural, Ji-Paraná, RO',
        source: 'sympla'
      };

      const nationalEvent = {
        title: 'Show Nacional em São Paulo',
        description: 'Artista famoso em turnê nacional',
        date: '20/03/2024',
        location: 'Arena São Paulo, São Paulo, SP',
        source: 'eventbrite'
      };

      const regionalResult = await dataProcessor.processEventData(regionalEvent, 'sympla');
      const nationalResult = await dataProcessor.processEventData(nationalEvent, 'eventbrite');

      expect(regionalResult.success).toBe(true);
      expect(nationalResult.success).toBe(true);

      expect(regionalResult.data.isRegional).toBe(true);
      expect(nationalResult.data.isRegional).toBe(false);

      expect(regionalResult.data.location.city).toBe('Ji-Paraná');
      expect(nationalResult.data.location.city).toBe('São Paulo');
    });
  });

  describe('Tratamento de Erros no Fluxo', () => {
    test('deve lidar com erro de conexão do banco durante salvamento', async () => {
      const eventData = {
        title: 'Evento para Teste de Erro',
        date: '15/03/2024',
        location: 'Local de Teste',
        source: 'eventbrite'
      };

      const processResult = await dataProcessor.processEventData(eventData, 'eventbrite');
      expect(processResult.success).toBe(true);

      // Simula erro de conexão
      jest.spyOn(dbHandler, 'insertEvent').mockRejectedValue(new Error('Database connection lost'));

      await expect(dbHandler.insertEvent(processResult.data)).rejects.toThrow('Database connection lost');
    });

    test('deve continuar processamento mesmo com alguns eventos inválidos', async () => {
      const mixedEvents = [
        {
          title: 'Evento Válido 1',
          date: '15/03/2024',
          location: 'Local Válido',
          source: 'eventbrite'
        },
        {
          title: '', // Título vazio - inválido
          date: '16/03/2024',
          location: 'Local',
          source: 'sympla'
        },
        {
          title: 'Evento Válido 2',
          date: '17/03/2024',
          location: 'Outro Local Válido',
          source: 'eventbrite'
        }
      ];

      const results = await dataProcessor.processEventsBatch(mixedEvents, 'mixed');

      expect(results.successful).toHaveLength(2);
      expect(results.rejected).toHaveLength(1);
      expect(results.errors).toHaveLength(0);

      // Verifica que os eventos válidos foram processados corretamente
      expect(results.successful[0].title).toBe('Evento Válido 1');
      expect(results.successful[1].title).toBe('Evento Válido 2');
    });
  });
});