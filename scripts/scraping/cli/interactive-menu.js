/**
 * Menu Interativo CLI
 * 
 * Interface amigável para seleção de fontes de scraping,
 * configurações regionais e opções de execução.
 * 
 * FOCO: Ji-Paraná/RO + Artistas Famosos do Brasil
 * POLÍTICA: Apenas eventos reais, sem dados fictícios
 */

const inquirer = require('inquirer');
const chalk = require('chalk');
const { Logger } = require('../utils/logger');
const config = require('../utils/config');

class InteractiveMenu {
  constructor() {
    this.logger = new Logger('menu');
    this.selectedSources = [];
    this.regionConfig = null;
    this.scrapingOptions = {
      maxEvents: 50,
      categories: [],
      dateRange: 'next_30_days',
      requireImages: true,
      onlyRegional: false
    };
  }

  /**
   * Exibe banner inicial do sistema
   */
  showBanner() {
    console.log('\n' + chalk.cyan('🎫 ═══════════════════════════════════════════════════════════════'));
    console.log(chalk.cyan('   SISTEMA DE SCRAPING DE EVENTOS BRASIL'));
    console.log(chalk.cyan('   ═══════════════════════════════════════════════════════════════'));
    console.log(chalk.gray('   📍 Foco: Ji-Paraná/RO + Artistas Famosos do Brasil'));
    console.log(chalk.gray('   ✅ Política: Apenas eventos reais, sem dados fictícios'));
    console.log(chalk.gray('   🔒 Sistema autenticado e seguro\n'));
  }

  /**
   * Menu principal do sistema
   */
  async showMainMenu() {
    this.showBanner();

    const mainMenuChoices = [
      {
        name: '🎯 Configurar Scraping Completo',
        value: 'full_setup',
        short: 'Setup Completo'
      },
      {
        name: '🕷️  Scraping Rápido (Configuração Padrão)',
        value: 'quick_scraping',
        short: 'Scraping Rápido'
      },
      {
        name: '⚙️  Configurações Avançadas',
        value: 'advanced_config',
        short: 'Configurações'
      },
      {
        name: '📊 Ver Estatísticas do Sistema',
        value: 'view_stats',
        short: 'Estatísticas'
      },
      {
        name: '❌ Sair',
        value: 'exit',
        short: 'Sair'
      }
    ];

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'O que você gostaria de fazer?',
        choices: mainMenuChoices,
        pageSize: 10
      }
    ]);

    switch (action) {
      case 'full_setup':
        return await this.fullSetupFlow();
      case 'quick_scraping':
        return await this.quickScrapingFlow();
      case 'advanced_config':
        return await this.advancedConfigFlow();
      case 'view_stats':
        return await this.viewStatsFlow();
      case 'exit':
        return this.exitFlow();
      default:
        return await this.showMainMenu();
    }
  }

  /**
   * Fluxo de configuração completa
   */
  async fullSetupFlow() {
    console.log(chalk.yellow('\n🎯 Configuração Completa de Scraping'));
    console.log(chalk.gray('Vamos configurar todos os aspectos do scraping passo a passo.\n'));

    // 1. Seleção de fontes
    await this.selectSources();

    // 2. Configuração regional
    await this.configureRegion();

    // 3. Configuração de categorias
    await this.selectCategories();

    // 4. Configurações de qualidade
    await this.configureQuality();

    // 5. Configurações de quantidade
    await this.configureQuantity();

    // 6. Confirmação final
    return await this.confirmConfiguration();
  }

  /**
   * Fluxo de scraping rápido
   */
  async quickScrapingFlow() {
    console.log(chalk.yellow('\n🕷️  Scraping Rápido'));
    console.log(chalk.gray('Usando configurações padrão otimizadas para Ji-Paraná/RO.\n'));

    // Configuração padrão
    this.selectedSources = ['eventbrite', 'sympla'];
    this.regionConfig = 'jiparana_and_national';
    this.scrapingOptions = {
      maxEvents: 30,
      categories: ['shows', 'teatro', 'gastronomia'],
      dateRange: 'next_30_days',
      requireImages: true,
      onlyRegional: false
    };

    console.log(chalk.green('✅ Configuração padrão aplicada:'));
    console.log(`   📍 Região: Ji-Paraná/RO + Eventos Nacionais`);
    console.log(`   🎪 Fontes: Eventbrite + Sympla`);
    console.log(`   📊 Máximo: ${this.scrapingOptions.maxEvents} eventos`);
    console.log(`   🎭 Categorias: Shows, Teatro, Gastronomia`);
    console.log(`   📅 Período: Próximos 30 dias`);

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Iniciar scraping com essas configurações?',
        default: true
      }
    ]);

    if (confirm) {
      return {
        action: 'start_scraping',
        config: this.buildFinalConfig()
      };
    } else {
      return await this.showMainMenu();
    }
  }

  /**
   * Seleção de fontes de scraping
   */
  async selectSources() {
    console.log(chalk.yellow('📡 Seleção de Fontes de Dados\n'));

    const sourceChoices = [
      {
        name: '🎫 Eventbrite Brasil (Recomendado)',
        value: 'eventbrite',
        checked: true
      },
      {
        name: '🎪 Sympla Brasil (Recomendado)',
        value: 'sympla',
        checked: true
      }
    ];

    const { sources } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'sources',
        message: 'Selecione as fontes de dados para scraping:',
        choices: sourceChoices,
        validate: (input) => {
          if (input.length === 0) {
            return 'Selecione pelo menos uma fonte de dados.';
          }
          return true;
        }
      }
    ]);

    this.selectedSources = sources;

    console.log(chalk.green(`\n✅ Fontes selecionadas: ${sources.map(s => 
      s === 'eventbrite' ? 'Eventbrite' : 'Sympla'
    ).join(', ')}`));

    return sources;
  }

  /**
   * Configuração regional
   */
  async configureRegion() {
    console.log(chalk.yellow('\n📍 Configuração Regional\n'));

    const regionChoices = [
      {
        name: '🎯 Ji-Paraná/RO + Eventos Nacionais (Recomendado)',
        value: 'jiparana_and_national',
        short: 'Ji-Paraná + Nacional'
      },
      {
        name: '🏠 Apenas Ji-Paraná e Região',
        value: 'jiparana_only',
        short: 'Apenas Regional'
      },
      {
        name: '🌎 Apenas Eventos Nacionais',
        value: 'national_only',
        short: 'Apenas Nacional'
      },
      {
        name: '🔧 Configuração Personalizada',
        value: 'custom',
        short: 'Personalizada'
      }
    ];

    const { region } = await inquirer.prompt([
      {
        type: 'list',
        name: 'region',
        message: 'Selecione o foco regional:',
        choices: regionChoices
      }
    ]);

    if (region === 'custom') {
      return await this.customRegionConfig();
    }

    this.regionConfig = region;

    const regionDescriptions = {
      'jiparana_and_national': 'Ji-Paraná/RO, cidades vizinhas e eventos de artistas famosos do Brasil',
      'jiparana_only': 'Apenas Ji-Paraná, Ariquemes, Cacoal, Rolim de Moura, Vilhena',
      'national_only': 'Apenas eventos nacionais de artistas famosos'
    };

    console.log(chalk.green(`\n✅ Configuração regional: ${regionDescriptions[region]}`));

    return region;
  }

  /**
   * Configuração regional personalizada
   */
  async customRegionConfig() {
    console.log(chalk.yellow('\n🔧 Configuração Regional Personalizada\n'));

    const { includeJiparana, includeNearby, includeNational, customCities } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'includeJiparana',
        message: 'Incluir eventos de Ji-Paraná?',
        default: true
      },
      {
        type: 'confirm',
        name: 'includeNearby',
        message: 'Incluir cidades vizinhas (Ariquemes, Cacoal, etc.)?',
        default: true,
        when: (answers) => answers.includeJiparana
      },
      {
        type: 'confirm',
        name: 'includeNational',
        message: 'Incluir eventos nacionais de artistas famosos?',
        default: true
      },
      {
        type: 'input',
        name: 'customCities',
        message: 'Cidades adicionais (separadas por vírgula):',
        when: (answers) => answers.includeJiparana || answers.includeNearby
      }
    ]);

    this.regionConfig = {
      type: 'custom',
      includeJiparana,
      includeNearby,
      includeNational,
      customCities: customCities ? customCities.split(',').map(c => c.trim()) : []
    };

    console.log(chalk.green('\n✅ Configuração regional personalizada salva'));

    return this.regionConfig;
  }

  /**
   * Seleção de categorias
   */
  async selectCategories() {
    console.log(chalk.yellow('\n🎭 Seleção de Categorias de Eventos\n'));

    const categoryChoices = Object.entries(config.categories).map(([key, category]) => ({
      name: `${category.icon} ${category.name}`,
      value: key,
      checked: ['shows', 'teatro', 'gastronomia'].includes(key)
    }));

    const { categories } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'categories',
        message: 'Selecione as categorias de interesse:',
        choices: categoryChoices,
        validate: (input) => {
          if (input.length === 0) {
            return 'Selecione pelo menos uma categoria.';
          }
          return true;
        }
      }
    ]);

    this.scrapingOptions.categories = categories;

    console.log(chalk.green(`\n✅ Categorias selecionadas: ${categories.length} categoria(s)`));

    return categories;
  }

  /**
   * Configurações de qualidade
   */
  async configureQuality() {
    console.log(chalk.yellow('\n✨ Configurações de Qualidade\n'));

    const { requireImages, requireDescription, minTitleLength } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'requireImages',
        message: 'Exigir que eventos tenham imagens?',
        default: true
      },
      {
        type: 'confirm',
        name: 'requireDescription',
        message: 'Exigir que eventos tenham descrição?',
        default: false
      },
      {
        type: 'list',
        name: 'minTitleLength',
        message: 'Tamanho mínimo do título do evento:',
        choices: [
          { name: '5 caracteres (Muito permissivo)', value: 5 },
          { name: '10 caracteres (Recomendado)', value: 10 },
          { name: '15 caracteres (Rigoroso)', value: 15 }
        ],
        default: 10
      }
    ]);

    this.scrapingOptions.requireImages = requireImages;
    this.scrapingOptions.requireDescription = requireDescription;
    this.scrapingOptions.minTitleLength = minTitleLength;

    console.log(chalk.green('\n✅ Configurações de qualidade definidas'));

    return { requireImages, requireDescription, minTitleLength };
  }

  /**
   * Configurações de quantidade
   */
  async configureQuantity() {
    console.log(chalk.yellow('\n📊 Configurações de Quantidade\n'));

    const { maxEvents, dateRange } = await inquirer.prompt([
      {
        type: 'list',
        name: 'maxEvents',
        message: 'Máximo de eventos para coletar:',
        choices: [
          { name: '20 eventos (Rápido)', value: 20 },
          { name: '50 eventos (Recomendado)', value: 50 },
          { name: '100 eventos (Completo)', value: 100 },
          { name: '200 eventos (Extensivo)', value: 200 }
        ],
        default: 50
      },
      {
        type: 'list',
        name: 'dateRange',
        message: 'Período de eventos:',
        choices: [
          { name: 'Próximos 15 dias', value: 'next_15_days' },
          { name: 'Próximos 30 dias (Recomendado)', value: 'next_30_days' },
          { name: 'Próximos 60 dias', value: 'next_60_days' },
          { name: 'Próximos 90 dias', value: 'next_90_days' }
        ],
        default: 'next_30_days'
      }
    ]);

    this.scrapingOptions.maxEvents = maxEvents;
    this.scrapingOptions.dateRange = dateRange;

    console.log(chalk.green(`\n✅ Configurado para coletar até ${maxEvents} eventos dos próximos ${dateRange.replace('next_', '').replace('_days', ' dias')}`));

    return { maxEvents, dateRange };
  }

  /**
   * Confirmação final da configuração
   */
  async confirmConfiguration() {
    console.log(chalk.yellow('\n📋 Resumo da Configuração\n'));

    const summary = this.buildConfigSummary();
    console.log(summary);

    const { confirm, saveConfig } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Confirma essa configuração e inicia o scraping?',
        default: true
      },
      {
        type: 'confirm',
        name: 'saveConfig',
        message: 'Salvar essa configuração como padrão?',
        default: false,
        when: (answers) => answers.confirm
      }
    ]);

    if (!confirm) {
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'O que gostaria de fazer?',
          choices: [
            { name: '🔄 Reconfigurar', value: 'reconfigure' },
            { name: '🏠 Voltar ao menu principal', value: 'main_menu' },
            { name: '❌ Sair', value: 'exit' }
          ]
        }
      ]);

      switch (action) {
        case 'reconfigure':
          return await this.fullSetupFlow();
        case 'main_menu':
          return await this.showMainMenu();
        case 'exit':
          return this.exitFlow();
      }
    }

    return {
      action: 'start_scraping',
      config: this.buildFinalConfig(),
      saveAsDefault: saveConfig
    };
  }

  /**
   * Constrói resumo da configuração
   */
  buildConfigSummary() {
    const sources = this.selectedSources.map(s => 
      s === 'eventbrite' ? 'Eventbrite' : 'Sympla'
    ).join(', ');

    const regionText = typeof this.regionConfig === 'string' ? 
      {
        'jiparana_and_national': 'Ji-Paraná/RO + Nacional',
        'jiparana_only': 'Apenas Ji-Paraná/RO',
        'national_only': 'Apenas Nacional'
      }[this.regionConfig] : 'Personalizada';

    const categories = this.scrapingOptions.categories.map(c => 
      config.categories[c]?.name || c
    ).join(', ');

    return chalk.cyan('📋 CONFIGURAÇÃO FINAL:') + '\n' +
           chalk.gray('─'.repeat(50)) + '\n' +
           chalk.white(`📡 Fontes: ${sources}\n`) +
           chalk.white(`📍 Região: ${regionText}\n`) +
           chalk.white(`🎭 Categorias: ${categories}\n`) +
           chalk.white(`📊 Máximo: ${this.scrapingOptions.maxEvents} eventos\n`) +
           chalk.white(`📅 Período: ${this.scrapingOptions.dateRange.replace('next_', '').replace('_days', ' dias')}\n`) +
           chalk.white(`✨ Imagens obrigatórias: ${this.scrapingOptions.requireImages ? 'Sim' : 'Não'}\n`) +
           chalk.gray('─'.repeat(50));
  }

  /**
   * Constrói configuração final
   */
  buildFinalConfig() {
    return {
      sources: this.selectedSources,
      region: this.regionConfig,
      options: this.scrapingOptions,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Fluxo de configurações avançadas
   */
  async advancedConfigFlow() {
    console.log(chalk.yellow('\n⚙️  Configurações Avançadas\n'));
    console.log(chalk.gray('Funcionalidade em desenvolvimento...'));
    
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'O que gostaria de fazer?',
        choices: [
          { name: '🏠 Voltar ao menu principal', value: 'main_menu' },
          { name: '❌ Sair', value: 'exit' }
        ]
      }
    ]);

    if (action === 'main_menu') {
      return await this.showMainMenu();
    } else {
      return this.exitFlow();
    }
  }

  /**
   * Fluxo de visualização de estatísticas
   */
  async viewStatsFlow() {
    console.log(chalk.yellow('\n📊 Estatísticas do Sistema\n'));
    console.log(chalk.gray('Funcionalidade em desenvolvimento...'));
    
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'O que gostaria de fazer?',
        choices: [
          { name: '🏠 Voltar ao menu principal', value: 'main_menu' },
          { name: '❌ Sair', value: 'exit' }
        ]
      }
    ]);

    if (action === 'main_menu') {
      return await this.showMainMenu();
    } else {
      return this.exitFlow();
    }
  }

  /**
   * Fluxo de saída
   */
  exitFlow() {
    console.log(chalk.yellow('\n👋 Obrigado por usar o Sistema de Scraping de Eventos Brasil!'));
    console.log(chalk.gray('Sistema encerrado com segurança.\n'));
    
    return {
      action: 'exit',
      message: 'Sistema encerrado pelo usuário'
    };
  }
}

module.exports = { InteractiveMenu };