/**
 * Parser de Datas
 * 
 * Converte datas em diferentes formatos brasileiros
 * para formato padrão do sistema.
 * 
 * FOCO: Ji-Paraná/RO + Artistas Famosos do Brasil
 * POLÍTICA: Apenas eventos reais, sem dados fictícios
 */

const { Logger } = require('../utils/logger');

class DateParser {
  constructor() {
    this.logger = new Logger('date-parser');
    
    // Mapeamento de meses em português
    this.monthNames = {
      'janeiro': 0, 'fevereiro': 1, 'março': 2, 'abril': 3,
      'maio': 4, 'junho': 5, 'julho': 6, 'agosto': 7,
      'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11,
      'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3,
      'mai': 4, 'jun': 5, 'jul': 6, 'ago': 7,
      'set': 8, 'out': 9, 'nov': 10, 'dez': 11
    };
    
    // Dias da semana em português
    this.weekDays = {
      'domingo': 0, 'segunda': 1, 'terça': 2, 'quarta': 3,
      'quinta': 4, 'sexta': 5, 'sábado': 6,
      'dom': 0, 'seg': 1, 'ter': 2, 'qua': 3,
      'qui': 4, 'sex': 5, 'sáb': 6
    };
    
    // Padrões de data suportados
    this.datePatterns = [
      // DD/MM/YYYY ou DD/MM/YY
      {
        regex: /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/,
        parser: this.parseDDMMYYYY.bind(this)
      },
      // DD de MMMM de YYYY
      {
        regex: /(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i,
        parser: this.parseDDdeMMMMdeYYYY.bind(this)
      },
      // DD de MMM de YYYY
      {
        regex: /(\d{1,2})\s+de\s+(\w{3})\s+de\s+(\d{4})/i,
        parser: this.parseDDdeMMMdeYYYY.bind(this)
      },
      // DD MMM YYYY
      {
        regex: /(\d{1,2})\s+(\w{3})\s+(\d{4})/i,
        parser: this.parseDDMMMYYYY.bind(this)
      },
      // MMMM DD, YYYY
      {
        regex: /(\w+)\s+(\d{1,2}),\s+(\d{4})/i,
        parser: this.parseMMMMDDYYYY.bind(this)
      },
      // YYYY-MM-DD (ISO)
      {
        regex: /(\d{4})-(\d{1,2})-(\d{1,2})/,
        parser: this.parseYYYYMMDD.bind(this)
      }
    ];
    
    // Padrões de hora
    this.timePatterns = [
      // HH:mm
      {
        regex: /(\d{1,2}):(\d{2})/,
        parser: this.parseHHMM.bind(this)
      },
      // HH:mm:ss
      {
        regex: /(\d{1,2}):(\d{2}):(\d{2})/,
        parser: this.parseHHMMSS.bind(this)
      },
      // HHh ou HHhMM
      {
        regex: /(\d{1,2})h(?:(\d{2}))?/i,
        parser: this.parseHHhMM.bind(this)
      }
    ];
    
    // Estatísticas
    this.stats = {
      totalParsed: 0,
      successful: 0,
      failed: 0,
      formatDistribution: {}
    };
  }

  /**
   * Faz parsing de uma string de data
   */
  parseDate(dateString) {
    if (!dateString || typeof dateString !== 'string') {
      this.stats.failed++;
      return null;
    }
    
    this.stats.totalParsed++;
    
    try {
      // Limpa e normaliza a string
      const cleanDateString = this.cleanDateString(dateString);
      
      // Tenta cada padrão de data
      for (const pattern of this.datePatterns) {
        const match = cleanDateString.match(pattern.regex);
        if (match) {
          const result = pattern.parser(match, cleanDateString);
          if (result) {
            this.stats.successful++;
            this.updateFormatStats(pattern.regex.source);
            
            this.logger.debug(`Data parseada: "${dateString}" -> ${result.toISOString()}`);
            return result;
          }
        }
      }
      
      // Fallback: tenta parsing nativo do JavaScript
      const fallbackDate = new Date(cleanDateString);
      if (!isNaN(fallbackDate.getTime()) && this.isReasonableDate(fallbackDate)) {
        this.stats.successful++;
        this.updateFormatStats('fallback');
        
        this.logger.debug(`Data parseada (fallback): "${dateString}" -> ${fallbackDate.toISOString()}`);
        return fallbackDate;
      }
      
      this.stats.failed++;
      this.logger.debug(`Falha ao parsear data: "${dateString}"`);
      return null;
      
    } catch (error) {
      this.stats.failed++;
      this.logger.debug(`Erro ao parsear data "${dateString}":`, error.message);
      return null;
    }
  }

  /**
   * Limpa e normaliza string de data
   */
  cleanDateString(dateString) {
    return dateString
      .trim()
      .replace(/^(seg|ter|qua|qui|sex|sáb|dom),?\s*/i, '') // Remove dia da semana
      .replace(/\s+às?\s+/i, ' ') // Normaliza "às"
      .replace(/\s+/g, ' ') // Normaliza espaços
      .toLowerCase();
  }

  /**
   * Parser para formato DD/MM/YYYY
   */
  parseDDMMYYYY(match) {
    const day = parseInt(match[1]);
    const month = parseInt(match[2]) - 1; // JavaScript months are 0-based
    let year = parseInt(match[3]);
    
    // Converte anos de 2 dígitos
    if (year < 100) {
      year += year < 50 ? 2000 : 1900;
    }
    
    const date = new Date(year, month, day);
    return this.isValidDate(date) ? date : null;
  }

  /**
   * Parser para formato DD de MMMM de YYYY
   */
  parseDDdeMMMMdeYYYY(match) {
    const day = parseInt(match[1]);
    const monthName = match[2].toLowerCase();
    const year = parseInt(match[3]);
    
    const month = this.monthNames[monthName];
    if (month === undefined) return null;
    
    const date = new Date(year, month, day);
    return this.isValidDate(date) ? date : null;
  }

  /**
   * Parser para formato DD de MMM de YYYY
   */
  parseDDdeMMMdeYYYY(match) {
    const day = parseInt(match[1]);
    const monthAbbr = match[2].toLowerCase();
    const year = parseInt(match[3]);
    
    const month = this.monthNames[monthAbbr];
    if (month === undefined) return null;
    
    const date = new Date(year, month, day);
    return this.isValidDate(date) ? date : null;
  }

  /**
   * Parser para formato DD MMM YYYY
   */
  parseDDMMMYYYY(match) {
    const day = parseInt(match[1]);
    const monthAbbr = match[2].toLowerCase();
    const year = parseInt(match[3]);
    
    const month = this.monthNames[monthAbbr];
    if (month === undefined) return null;
    
    const date = new Date(year, month, day);
    return this.isValidDate(date) ? date : null;
  }

  /**
   * Parser para formato MMMM DD, YYYY
   */
  parseMMMMDDYYYY(match) {
    const monthName = match[1].toLowerCase();
    const day = parseInt(match[2]);
    const year = parseInt(match[3]);
    
    const month = this.monthNames[monthName];
    if (month === undefined) return null;
    
    const date = new Date(year, month, day);
    return this.isValidDate(date) ? date : null;
  }

  /**
   * Parser para formato YYYY-MM-DD
   */
  parseYYYYMMDD(match) {
    const year = parseInt(match[1]);
    const month = parseInt(match[2]) - 1;
    const day = parseInt(match[3]);
    
    const date = new Date(year, month, day);
    return this.isValidDate(date) ? date : null;
  }

  /**
   * Parser para formato HH:mm
   */
  parseHHMM(match) {
    const hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return { hours, minutes, seconds: 0 };
    }
    
    return null;
  }

  /**
   * Parser para formato HH:mm:ss
   */
  parseHHMMSS(match) {
    const hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const seconds = parseInt(match[3]);
    
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59 && seconds >= 0 && seconds <= 59) {
      return { hours, minutes, seconds };
    }
    
    return null;
  }

  /**
   * Parser para formato HHh ou HHhMM
   */
  parseHHhMM(match) {
    const hours = parseInt(match[1]);
    const minutes = match[2] ? parseInt(match[2]) : 0;
    
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return { hours, minutes, seconds: 0 };
    }
    
    return null;
  }

  /**
   * Faz parsing de data e hora combinadas
   */
  parseDateTime(dateTimeString) {
    if (!dateTimeString) return null;
    
    try {
      // Separa data e hora
      const parts = dateTimeString.split(/\s+às?\s+|\s+/i);
      
      if (parts.length === 1) {
        // Apenas data
        return this.parseDate(parts[0]);
      }
      
      // Data e hora
      const datePart = parts[0];
      const timePart = parts[parts.length - 1];
      
      const date = this.parseDate(datePart);
      if (!date) return null;
      
      const time = this.parseTime(timePart);
      if (time) {
        date.setHours(time.hours, time.minutes, time.seconds);
      }
      
      return date;
      
    } catch (error) {
      this.logger.debug(`Erro ao parsear data/hora "${dateTimeString}":`, error.message);
      return null;
    }
  }

  /**
   * Faz parsing apenas da hora
   */
  parseTime(timeString) {
    if (!timeString) return null;
    
    const cleanTimeString = timeString.trim().toLowerCase();
    
    for (const pattern of this.timePatterns) {
      const match = cleanTimeString.match(pattern.regex);
      if (match) {
        return pattern.parser(match);
      }
    }
    
    return null;
  }

  /**
   * Valida se uma data é válida
   */
  isValidDate(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return false;
    }
    
    return this.isReasonableDate(date);
  }

  /**
   * Verifica se a data está em um range razoável
   */
  isReasonableDate(date) {
    const now = new Date();
    const minDate = new Date(now.getFullYear() - 1, 0, 1); // 1 ano atrás
    const maxDate = new Date(now.getFullYear() + 2, 11, 31); // 2 anos no futuro
    
    return date >= minDate && date <= maxDate;
  }

  /**
   * Formata data para padrão ISO
   */
  formatToStandard(date) {
    if (!this.isValidDate(date)) {
      return null;
    }
    
    return date.toISOString();
  }

  /**
   * Formata data para exibição em português
   */
  formatToBrazilian(date, includeTime = false) {
    if (!this.isValidDate(date)) {
      return null;
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    let formatted = `${day}/${month}/${year}`;
    
    if (includeTime) {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      formatted += ` às ${hours}:${minutes}`;
    }
    
    return formatted;
  }

  /**
   * Calcula diferença em dias entre duas datas
   */
  daysDifference(date1, date2) {
    if (!this.isValidDate(date1) || !this.isValidDate(date2)) {
      return null;
    }
    
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Verifica se um evento é futuro
   */
  isFutureEvent(eventDate) {
    if (!this.isValidDate(eventDate)) {
      return false;
    }
    
    const now = new Date();
    return eventDate > now;
  }

  /**
   * Obtém estatísticas do parser
   */
  getStats() {
    const successRate = this.stats.totalParsed > 0 ? 
      Math.round((this.stats.successful / this.stats.totalParsed) * 100) : 0;
    
    return {
      ...this.stats,
      successRate: `${successRate}%`
    };
  }

  /**
   * Atualiza estatísticas de formato
   */
  updateFormatStats(format) {
    this.stats.formatDistribution[format] = 
      (this.stats.formatDistribution[format] || 0) + 1;
  }

  /**
   * Reseta estatísticas
   */
  resetStats() {
    this.stats = {
      totalParsed: 0,
      successful: 0,
      failed: 0,
      formatDistribution: {}
    };
  }

  /**
   * Testa o parser com exemplos
   */
  runTests() {
    const testCases = [
      '15/03/2024',
      '15 de março de 2024',
      '15 de mar de 2024',
      '15 mar 2024',
      'março 15, 2024',
      '2024-03-15',
      'seg, 15/03/2024 às 19:30',
      '15/03/2024 19h30',
      '15/03/2024 19:30:00'
    ];
    
    this.logger.info('Executando testes do DateParser');
    
    const results = testCases.map(testCase => {
      const result = this.parseDate(testCase);
      return {
        input: testCase,
        output: result ? result.toISOString() : null,
        success: result !== null
      };
    });
    
    const successCount = results.filter(r => r.success).length;
    this.logger.info(`Testes concluídos: ${successCount}/${testCases.length} sucessos`);
    
    return results;
  }
}

module.exports = { DateParser };