# 🏗️ Arquitetura do Sistema

## Visão Geral

O sistema de scraping de eventos é construído com uma arquitetura modular e escalável, focada em confiabilidade e manutenibilidade.

## Componentes Principais

### 1. Interface Layer
- **CLI Interface**: Menu interativo para operações manuais
- **Web Interface**: Dashboard para visualização (futuro)
- **Cron Jobs**: Execução automatizada

### 2. Core Application
- **Main Controller**: Orquestra todas as operações
- **Configuration Manager**: Gerencia configurações
- **Logger**: Sistema de logging estruturado
- **Error Handler**: Tratamento centralizado de erros

### 3. Scrapers Layer
- **Base Scraper**: Classe abstrata com funcionalidades comuns
- **Eventbrite Scraper**: Implementação específica para Eventbrite
- **Sympla Scraper**: Implementação específica para Sympla
- **Generic Scraper**: Para sites não específicos

### 4. Processing Layer
- **Data Validator**: Validação de dados coletados
- **Data Normalizer**: Padronização de formatos
- **Data Enricher**: Adição de informações complementares
- **Duplicate Detector**: Identificação de eventos duplicados

### 5. Storage Layer
- **Supabase Client**: Interface com banco de dados
- **File Storage**: Armazenamento de arquivos locais
- **Cache Manager**: Sistema de cache para performance

### 6. Reports Layer
- **Report Generator**: Geração de relatórios
- **Chart Generator**: Criação de gráficos
- **Export Manager**: Exportação em diferentes formatos

## Fluxo de Dados

### 1. Coleta de Dados
```
User Input → Scraper Selection → Target Configuration → Data Extraction
```

### 2. Processamento
```
Raw Data → Validation → Normalization → Enrichment → Duplicate Check
```

### 3. Armazenamento
```
Processed Data → Database Storage → File Backup → Cache Update
```

### 4. Relatórios
```
Stored Data → Analysis → Report Generation → Export → Notification
```
