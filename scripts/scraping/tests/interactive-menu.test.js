/**
 * Testes Unitários para Menu Interativo
 */

const { InteractiveMenu } = require('../cli/interactive-menu');

// Mock do inquirer
jest.mock('inquirer', () => ({
  prompt: jest.fn()
}));

const inquirer = require('inquirer');

describe('InteractiveMenu', () => {
  let menu;
  let consoleSpy;

  beforeEach(() => {
    menu = new InteractiveMenu();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    inquirer.prompt.mockClear();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('inicialização', () => {
    test('deve inicializar com configurações padrão', () => {
      expect(menu.selectedSources).toEqual([]);
      expect(menu.regionConfig).toBeNull();
      expect(menu.scrapingOptions).toBeDefined();
      expect(menu.scrapingOptions.maxEvents).toBe(50);
      expect(menu.scrapingOptions.requireImages).toBe(true);
    });
  });

  describe('showBanner', () => {
    test('deve exibir banner do sistema', () => {
      menu.showBanner();
      
      expect(consoleSpy).toHaveBeenCalled();
      const calls = consoleSpy.mock.calls.map(call => call[0]);
      const bannerText = calls.join(' ');
      
      expect(bannerText).toContain('SISTEMA DE SCRAPING DE EVENTOS BRASIL');
      expect(bannerText).toContain('Ji-Paraná/RO');
      expect(bannerText).toContain('eventos reais');
    });
  });

  describe('selectSources', () => {
    test('deve permitir seleção de fontes', async () => {
      inquirer.prompt.mockResolvedValue({
        sources: ['eventbrite', 'sympla']
      });

      const result = await menu.selectSources();

      expect(result).toEqual(['eventbrite', 'sympla']);
      expect(menu.selectedSources).toEqual(['eventbrite', 'sympla']);
      expect(inquirer.prompt).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'checkbox',
          name: 'sources',
          message: expect.stringContaining('fontes de dados')
        })
      ]);
    });

    test('deve validar que pelo menos uma fonte seja selecionada', async () => {
      inquirer.prompt.mockResolvedValue({
        sources: ['eventbrite']
      });

      await menu.selectSources();

      const promptCall = inquirer.prompt.mock.calls[0][0][0];
      expect(promptCall.validate).toBeDefined();
      
      // Testa validação com array vazio
      const emptyValidation = promptCall.validate([]);
      expect(emptyValidation).toBe('Selecione pelo menos uma fonte de dados.');
      
      // Testa validação com seleção válida
      const validValidation = promptCall.validate(['eventbrite']);
      expect(validValidation).toBe(true);
    });
  });

  describe('configureRegion', () => {
    test('deve permitir seleção de região padrão', async () => {
      inquirer.prompt.mockResolvedValue({
        region: 'jiparana_and_national'
      });

      const result = await menu.configureRegion();

      expect(result).toBe('jiparana_and_national');
      expect(menu.regionConfig).toBe('jiparana_and_national');
    });

    test('deve permitir configuração personalizada', async () => {
      inquirer.prompt
        .mockResolvedValueOnce({ region: 'custom' })
        .mockResolvedValueOnce({
          includeJiparana: true,
          includeNearby: true,
          includeNational: false,
          customCities: 'Porto Velho, Guajará-Mirim'
        });

      const result = await menu.configureRegion();

      expect(result.type).toBe('custom');
      expect(result.includeJiparana).toBe(true);
      expect(result.includeNearby).toBe(true);
      expect(result.includeNational).toBe(false);
      expect(result.customCities).toEqual(['Porto Velho', 'Guajará-Mirim']);
    });
  });

  describe('selectCategories', () => {
    test('deve permitir seleção de categorias', async () => {
      inquirer.prompt.mockResolvedValue({
        categories: ['shows', 'teatro', 'gastronomia']
      });

      const result = await menu.selectCategories();

      expect(result).toEqual(['shows', 'teatro', 'gastronomia']);
      expect(menu.scrapingOptions.categories).toEqual(['shows', 'teatro', 'gastronomia']);
    });

    test('deve validar que pelo menos uma categoria seja selecionada', async () => {
      inquirer.prompt.mockResolvedValue({
        categories: ['shows']
      });

      await menu.selectCategories();

      const promptCall = inquirer.prompt.mock.calls[0][0][0];
      expect(promptCall.validate).toBeDefined();
      
      // Testa validação com array vazio
      const emptyValidation = promptCall.validate([]);
      expect(emptyValidation).toBe('Selecione pelo menos uma categoria.');
      
      // Testa validação com seleção válida
      const validValidation = promptCall.validate(['shows']);
      expect(validValidation).toBe(true);
    });
  });

  describe('configureQuality', () => {
    test('deve configurar opções de qualidade', async () => {
      inquirer.prompt.mockResolvedValue({
        requireImages: true,
        requireDescription: false,
        minTitleLength: 10
      });

      const result = await menu.configureQuality();

      expect(result.requireImages).toBe(true);
      expect(result.requireDescription).toBe(false);
      expect(result.minTitleLength).toBe(10);
      expect(menu.scrapingOptions.requireImages).toBe(true);
      expect(menu.scrapingOptions.requireDescription).toBe(false);
      expect(menu.scrapingOptions.minTitleLength).toBe(10);
    });
  });

  describe('configureQuantity', () => {
    test('deve configurar quantidade e período', async () => {
      inquirer.prompt.mockResolvedValue({
        maxEvents: 100,
        dateRange: 'next_60_days'
      });

      const result = await menu.configureQuantity();

      expect(result.maxEvents).toBe(100);
      expect(result.dateRange).toBe('next_60_days');
      expect(menu.scrapingOptions.maxEvents).toBe(100);
      expect(menu.scrapingOptions.dateRange).toBe('next_60_days');
    });
  });

  describe('quickScrapingFlow', () => {
    test('deve configurar scraping rápido com confirmação', async () => {
      inquirer.prompt.mockResolvedValue({ confirm: true });

      const result = await menu.quickScrapingFlow();

      expect(result.action).toBe('start_scraping');
      expect(result.config).toBeDefined();
      expect(result.config.sources).toEqual(['eventbrite', 'sympla']);
      expect(menu.selectedSources).toEqual(['eventbrite', 'sympla']);
      expect(menu.regionConfig).toBe('jiparana_and_national');
      expect(menu.scrapingOptions.maxEvents).toBe(30);
    });

    test('deve voltar ao menu principal se não confirmado', async () => {
      inquirer.prompt.mockResolvedValue({ confirm: false });
      
      // Mock do showMainMenu para evitar loop infinito
      menu.showMainMenu = jest.fn().mockResolvedValue({ action: 'exit' });

      const result = await menu.quickScrapingFlow();

      expect(menu.showMainMenu).toHaveBeenCalled();
    });
  });

  describe('buildConfigSummary', () => {
    test('deve construir resumo da configuração', () => {
      menu.selectedSources = ['eventbrite', 'sympla'];
      menu.regionConfig = 'jiparana_and_national';
      menu.scrapingOptions = {
        categories: ['shows', 'teatro'],
        maxEvents: 50,
        dateRange: 'next_30_days',
        requireImages: true
      };

      const summary = menu.buildConfigSummary();

      expect(summary).toContain('Eventbrite, Sympla');
      expect(summary).toContain('Ji-Paraná/RO + Nacional');
      expect(summary).toContain('50 eventos');
      expect(summary).toContain('30 dias');
      expect(summary).toContain('Sim'); // Para imagens obrigatórias
    });
  });

  describe('buildFinalConfig', () => {
    test('deve construir configuração final', () => {
      menu.selectedSources = ['eventbrite'];
      menu.regionConfig = 'jiparana_only';
      menu.scrapingOptions = {
        maxEvents: 25,
        categories: ['shows'],
        dateRange: 'next_15_days',
        requireImages: true
      };

      const config = menu.buildFinalConfig();

      expect(config.sources).toEqual(['eventbrite']);
      expect(config.region).toBe('jiparana_only');
      expect(config.options.maxEvents).toBe(25);
      expect(config.options.categories).toEqual(['shows']);
      expect(config.timestamp).toBeDefined();
      expect(new Date(config.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('exitFlow', () => {
    test('deve retornar configuração de saída', () => {
      const result = menu.exitFlow();

      expect(result.action).toBe('exit');
      expect(result.message).toBe('Sistema encerrado pelo usuário');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Obrigado por usar')
      );
    });
  });

  describe('fluxos de menu', () => {
    test('advancedConfigFlow deve mostrar funcionalidade em desenvolvimento', async () => {
      inquirer.prompt.mockResolvedValue({ action: 'main_menu' });
      menu.showMainMenu = jest.fn().mockResolvedValue({ action: 'exit' });

      await menu.advancedConfigFlow();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('em desenvolvimento')
      );
      expect(menu.showMainMenu).toHaveBeenCalled();
    });

    test('viewStatsFlow deve mostrar funcionalidade em desenvolvimento', async () => {
      inquirer.prompt.mockResolvedValue({ action: 'exit' });

      const result = await menu.viewStatsFlow();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('em desenvolvimento')
      );
      expect(result.action).toBe('exit');
    });
  });
});