# 📁 Scripts - Reuni App

Scripts organizados por categoria para facilitar manutenção e uso.

## 📊 [Monitoring](./monitoring/) - Monitoramento do Sistema

### Scripts de Monitoramento
- **[monitor-performance.js](./monitoring/monitor-performance.js)** - Monitora performance da aplicação
- **[monitor-supabase.js](./monitoring/monitor-supabase.js)** - Monitora conectividade com Supabase
- **[test-supabase.js](./monitoring/test-supabase.js)** - Testa conexão e funcionalidades do Supabase

### Como Usar
```bash
# Monitorar performance
node scripts/monitoring/monitor-performance.js

# Monitorar Supabase
node scripts/monitoring/monitor-supabase.js

# Testar conexão Supabase
node scripts/monitoring/test-supabase.js
```

## 🔧 [Maintenance](./maintenance/) - Manutenção e Limpeza

### Scripts de Manutenção
- **[001_cleanup-fake-data.js](./maintenance/001_cleanup-fake-data.js)** - Remove dados falsos/fictícios
- **[restart-dev.js](./maintenance/restart-dev.js)** - Reinicia servidor de desenvolvimento

### Como Usar
```bash
# Limpar dados falsos
node scripts/maintenance/001_cleanup-fake-data.js

# Reiniciar desenvolvimento
node scripts/maintenance/restart-dev.js
```

## 🎯 [Scraping](./scraping/) - Sistema de Scraping

### Sistema Completo
O sistema de scraping possui sua própria estrutura organizada:

```
scraping/
├── 📁 auth/              # Sistema de autenticação
├── 📁 cli/               # Interface de linha de comando
├── 📁 docs/              # Documentação específica
├── 📁 monitoring/        # Monitoramento de estrutura
├── 📁 processors/        # Processamento de dados
├── 📁 reports/           # Geração de relatórios
├── 📁 scrapers/          # Scrapers específicos
├── 📁 scripts/           # Scripts de automação
├── 📁 storage/           # Armazenamento de dados
├── 📁 tests/             # Testes automatizados
├── 📁 utils/             # Utilitários gerais
├── 📄 index.js           # Ponto de entrada principal
├── 📄 package.json       # Dependências e scripts
└── 📄 README.md          # Documentação principal
```

### Como Usar
```bash
# Entrar na pasta do scraping
cd scripts/scraping

# Instalar dependências
npm install

# Executar sistema completo
npm start

# Ver documentação completa
cat README.md
```

## 🎯 Scripts por Categoria

### 📊 Monitoramento
- **Performance**: Monitora uso de CPU, memória e tempo de resposta
- **Supabase**: Verifica conectividade e status do banco de dados
- **Testes**: Executa verificações automáticas de funcionalidade

### 🔧 Manutenção
- **Limpeza**: Remove dados desnecessários ou corrompidos
- **Reinicialização**: Reinicia serviços e processos
- **Backup**: Scripts de backup e restauração (futuros)

### 🎯 Scraping
- **Sistema Completo**: Coleta automatizada de eventos
- **Processamento**: Validação e normalização de dados
- **Relatórios**: Geração de análises e estatísticas

## 🚀 Como Executar

### Execução Direta
```bash
# Executar script específico
node scripts/categoria/nome-do-script.js

# Exemplo: monitorar performance
node scripts/monitoring/monitor-performance.js
```

### Via NPM Scripts (se configurado)
```bash
# Scripts configurados no package.json principal
npm run monitor:performance
npm run monitor:supabase
npm run test:supabase
```

### Scripts do Scraping
```bash
# Entrar na pasta do scraping
cd scripts/scraping

# Usar scripts específicos do scraping
npm start              # Menu interativo
npm run dev           # Modo desenvolvimento
npm test              # Executar testes
npm run setup         # Configuração inicial
```

## 📋 Convenções

### Nomenclatura
- **Prefixos numéricos**: Para scripts que devem ser executados em ordem
- **Nomes descritivos**: Indicam claramente a função do script
- **Categorias claras**: Organizados por função principal

### Estrutura de Arquivos
- **Documentação**: README.md em cada pasta
- **Configuração**: Arquivos .env e config quando necessário
- **Logs**: Pasta logs/ para saídas quando aplicável

### Padrões de Código
- **Node.js**: Todos os scripts em JavaScript/Node.js
- **Error Handling**: Tratamento adequado de erros
- **Logging**: Saídas informativas e estruturadas
- **Configuração**: Variáveis de ambiente quando necessário

## 🔗 Links Relacionados

- **[Documentação Principal](../docs/README.md)** - Documentação completa do projeto
- **[Sistema de Scraping](./scraping/README.md)** - Documentação específica do scraping
- **[Troubleshooting](../TROUBLESHOOTING.md)** - Solução de problemas comuns

---

**📁 Scripts organizados por categoria para melhor manutenção e uso**