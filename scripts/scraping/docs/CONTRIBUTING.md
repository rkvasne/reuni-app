# 🤝 Guia de Contribuição

## Bem-vindo!

Obrigado pelo interesse em contribuir com o projeto de scraping de eventos do Brasil!

## 🚀 Começando

### Pré-requisitos
- Node.js 18+
- Git
- Conta no GitHub
- Conhecimento básico de JavaScript/Node.js

### Setup do Ambiente
```bash
# 1. Fork o repositório no GitHub

# 2. Clone seu fork
git clone https://github.com/seu-usuario/eventos-scraper-brasil.git
cd eventos-scraper-brasil

# 3. Instale dependências
npm install

# 4. Configure o ambiente
npm run setup

# 5. Execute os testes
npm test

# 6. Inicie o sistema
npm start
```

## 📝 Padrões de Código

### Estilo de Código
- Use ESLint (configuração incluída)
- Indentação: 2 espaços
- Aspas simples para strings
- Ponto e vírgula obrigatório

### Convenções de Nomenclatura
- **Arquivos:** kebab-case (`event-scraper.js`)
- **Classes:** PascalCase (`EventScraper`)
- **Funções/Variáveis:** camelCase (`scrapeEvents`)
- **Constantes:** UPPER_SNAKE_CASE (`MAX_RETRIES`)

## 🧪 Testes

### Executar Testes
```bash
npm test
npm run test:coverage
npm run test:watch
```

## 🏷️ Convenções de Commit

Use [Conventional Commits](https://conventionalcommits.org/):

- `feat:` nova funcionalidade
- `fix:` correção de bug
- `docs:` mudanças na documentação
- `test:` adição ou correção de testes
- `chore:` tarefas de manutenção
