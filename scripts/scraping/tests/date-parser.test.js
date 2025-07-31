/**
 * Testes para DateParser
 */

const { DateParser } = require('../processors/date-parser');

describe('DateParser', () => {
  let dateParser;

  beforeEach(() => {
    dateParser = new DateParser();
  });

  afterEach(() => {
    dateParser.resetStats();
  });

  describe('parseDate', () => {
    test('deve parsear data no formato DD/MM/YYYY', () => {
      const result = dateParser.parseDate('15/03/2024');
      
      expect(result).toBeDefined();
      expect(new Date(result).getDate()).toBe(15);
      expect(new Date(result).getMonth()).toBe(2); // Março = 2 (0-based)
      expect(new Date(result).getFullYear()).toBe(2024);
    });

    test('deve parsear data no formato DD de MMMM de YYYY', () => {
      const result = dateParser.parseDate('15 de março de 2024');
      
      expect(result).toBeDefined();
      expect(new Date(result).getDate()).toBe(15);
      expect(new Date(result).getMonth()).toBe(2);
      expect(new Date(result).getFullYear()).toBe(2024);
    });

    test('deve parsear data no formato DD de MMM de YYYY', () => {
      const result = dateParser.parseDate('15 de mar de 2024');
      
      expect(result).toBeDefined();
      expect(new Date(result).getDate()).toBe(15);
      expect(new Date(result).getMonth()).toBe(2);
    });

    test('deve parsear data no formato DD MMM YYYY', () => {
      const result = dateParser.parseDate('15 mar 2024');
      
      expect(result).toBeDefined();
      expect(new Date(result).getDate()).toBe(15);
      expect(new Date(result).getMonth()).toBe(2);
    });

    test('deve parsear data no formato YYYY-MM-DD', () => {
      const result = dateParser.parseDate('2024-03-15');
      
      expect(result).toBeDefined();
      expect(new Date(result).getDate()).toBe(15);
      expect(new Date(result).getMonth()).toBe(2);
    });

    test('deve remover dia da semana do início', () => {
      const result = dateParser.parseDate('seg, 15/03/2024');
      
      expect(result).toBeDefined();
      expect(new Date(result).getDate()).toBe(15);
    });

    test('deve retornar null para data inválida', () => {
      const result = dateParser.parseDate('data inválida');
      
      expect(result).toBeNull();
    });

    test('deve retornar null para entrada vazia', () => {
      expect(dateParser.parseDate('')).toBeNull();
      expect(dateParser.parseDate(null)).toBeNull();
      expect(dateParser.parseDate(undefined)).toBeNull();
    });

    test('deve converter anos de 2 dígitos corretamente', () => {
      const result = dateParser.parseDate('15/03/24');
      
      expect(result).toBeDefined();
      expect(new Date(result).getFullYear()).toBe(2024);
    });
  });

  describe('parseDateTime', () => {
    test('deve parsear data e hora combinadas', () => {
      const result = dateParser.parseDateTime('15/03/2024 às 19:30');
      
      expect(result).toBeDefined();
      expect(new Date(result).getHours()).toBe(19);
      expect(new Date(result).getMinutes()).toBe(30);
    });

    test('deve parsear apenas data quando hora não fornecida', () => {
      const result = dateParser.parseDateTime('15/03/2024');
      
      expect(result).toBeDefined();
      expect(new Date(result).getDate()).toBe(15);
    });

    test('deve parsear formato com "h"', () => {
      const result = dateParser.parseDateTime('15/03/2024 19h30');
      
      expect(result).toBeDefined();
      expect(new Date(result).getHours()).toBe(19);
      expect(new Date(result).getMinutes()).toBe(30);
    });
  });

  describe('parseTime', () => {
    test('deve parsear hora no formato HH:mm', () => {
      const result = dateParser.parseTime('19:30');
      
      expect(result).toEqual({
        hours: 19,
        minutes: 30,
        seconds: 0
      });
    });

    test('deve parsear hora no formato HH:mm:ss', () => {
      const result = dateParser.parseTime('19:30:45');
      
      expect(result).toEqual({
        hours: 19,
        minutes: 30,
        seconds: 45
      });
    });

    test('deve parsear hora no formato HHh', () => {
      const result = dateParser.parseTime('19h');
      
      expect(result).toEqual({
        hours: 19,
        minutes: 0,
        seconds: 0
      });
    });

    test('deve parsear hora no formato HHhMM', () => {
      const result = dateParser.parseTime('19h30');
      
      expect(result).toEqual({
        hours: 19,
        minutes: 30,
        seconds: 0
      });
    });

    test('deve retornar null para hora inválida', () => {
      expect(dateParser.parseTime('25:00')).toBeNull();
      expect(dateParser.parseTime('12:70')).toBeNull();
      expect(dateParser.parseTime('hora inválida')).toBeNull();
    });
  });

  describe('isValidDate', () => {
    test('deve validar data válida', () => {
      const validDate = new Date('2024-03-15');
      
      expect(dateParser.isValidDate(validDate)).toBe(true);
    });

    test('deve rejeitar data inválida', () => {
      const invalidDate = new Date('invalid');
      
      expect(dateParser.isValidDate(invalidDate)).toBe(false);
    });

    test('deve rejeitar data muito antiga', () => {
      const oldDate = new Date('1900-01-01');
      
      expect(dateParser.isValidDate(oldDate)).toBe(false);
    });

    test('deve rejeitar data muito futura', () => {
      const futureDate = new Date('2030-01-01');
      
      expect(dateParser.isValidDate(futureDate)).toBe(false);
    });
  });

  describe('formatToStandard', () => {
    test('deve formatar data para ISO string', () => {
      const date = new Date('2024-03-15T10:30:00');
      
      const result = dateParser.formatToStandard(date);
      
      expect(result).toBe(date.toISOString());
    });

    test('deve retornar null para data inválida', () => {
      const invalidDate = new Date('invalid');
      
      const result = dateParser.formatToStandard(invalidDate);
      
      expect(result).toBeNull();
    });
  });

  describe('formatToBrazilian', () => {
    test('deve formatar data para formato brasileiro', () => {
      const date = new Date('2024-03-15T10:30:00');
      
      const result = dateParser.formatToBrazilian(date);
      
      expect(result).toBe('15/03/2024');
    });

    test('deve incluir hora quando solicitado', () => {
      const date = new Date('2024-03-15T10:30:00');
      
      const result = dateParser.formatToBrazilian(date, true);
      
      expect(result).toBe('15/03/2024 às 10:30');
    });
  });

  describe('daysDifference', () => {
    test('deve calcular diferença em dias', () => {
      const date1 = new Date('2024-03-15');
      const date2 = new Date('2024-03-20');
      
      const result = dateParser.daysDifference(date1, date2);
      
      expect(result).toBe(5);
    });

    test('deve retornar valor absoluto', () => {
      const date1 = new Date('2024-03-20');
      const date2 = new Date('2024-03-15');
      
      const result = dateParser.daysDifference(date1, date2);
      
      expect(result).toBe(5);
    });

    test('deve retornar null para datas inválidas', () => {
      const validDate = new Date('2024-03-15');
      const invalidDate = new Date('invalid');
      
      const result = dateParser.daysDifference(validDate, invalidDate);
      
      expect(result).toBeNull();
    });
  });

  describe('isFutureEvent', () => {
    test('deve identificar evento futuro', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Amanhã
      
      const result = dateParser.isFutureEvent(futureDate);
      
      expect(result).toBe(true);
    });

    test('deve identificar evento passado', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Ontem
      
      const result = dateParser.isFutureEvent(pastDate);
      
      expect(result).toBe(false);
    });

    test('deve retornar false para data inválida', () => {
      const invalidDate = new Date('invalid');
      
      const result = dateParser.isFutureEvent(invalidDate);
      
      expect(result).toBe(false);
    });
  });

  describe('getStats', () => {
    test('deve retornar estatísticas iniciais', () => {
      const stats = dateParser.getStats();
      
      expect(stats).toHaveProperty('totalParsed', 0);
      expect(stats).toHaveProperty('successful', 0);
      expect(stats).toHaveProperty('failed', 0);
      expect(stats).toHaveProperty('successRate', '0%');
    });

    test('deve atualizar estatísticas após parsing', () => {
      dateParser.parseDate('15/03/2024');
      dateParser.parseDate('data inválida');
      
      const stats = dateParser.getStats();
      
      expect(stats.totalParsed).toBe(2);
      expect(stats.successful).toBe(1);
      expect(stats.failed).toBe(1);
      expect(stats.successRate).toBe('50%');
    });
  });

  describe('runTests', () => {
    test('deve executar testes internos', () => {
      const results = dateParser.runTests();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      results.forEach(result => {
        expect(result).toHaveProperty('input');
        expect(result).toHaveProperty('output');
        expect(result).toHaveProperty('success');
      });
    });
  });

  describe('buildDateFromMatch', () => {
    test('deve construir data a partir de match DD/MM/YYYY', () => {
      const match = ['15/03/2024', '15', '03', '2024'];
      const format = { source: '(\\d{1,2})/(\\d{1,2})/(\\d{4})' };
      
      const result = dateParser.buildDateFromMatch(match, format);
      
      expect(result).toBeInstanceOf(Date);
      expect(result.getDate()).toBe(15);
      expect(result.getMonth()).toBe(2);
      expect(result.getFullYear()).toBe(2024);
    });

    test('deve construir data a partir de match com mês por extenso', () => {
      const match = ['15 de março de 2024', '15', 'março', '2024'];
      const format = { source: '(\\d{1,2})\\s+de\\s+(\\w+)\\s+de\\s+(\\d{4})' };
      
      const result = dateParser.buildDateFromMatch(match, format);
      
      expect(result).toBeInstanceOf(Date);
      expect(result.getDate()).toBe(15);
      expect(result.getMonth()).toBe(2);
    });
  });
});