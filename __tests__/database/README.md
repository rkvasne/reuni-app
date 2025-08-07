# Testes de Políticas RLS (Row Level Security)

Este diretório contém testes abrangentes para validar as políticas de Row Level Security implementadas no banco de dados do Reuni.

## Estrutura dos Testes

### 📁 Arquivos de Teste

- **`rls-policies.test.ts`** - Testes básicos de todas as políticas RLS
- **`rls-edge-cases.test.ts`** - Cenários edge case e ataques de segurança
- **`rls-performance.test.ts`** - Testes de performance das políticas

### 🎯 Cobertura dos Testes

#### Tabelas Testadas
- ✅ `usuarios` - Perfis de usuário
- ✅ `eventos` - Sistema de eventos
- ✅ `presencas` - Participação em eventos
- ✅ `comentarios` - Comentários em eventos
- ✅ `curtidas_evento` - Sistema de likes
- ✅ `comunidades` - Comunidades de usuários
- ✅ `membros_comunidade` - Participação em comunidades
- ✅ `posts_comunidade` - Posts dentro de comunidades

#### Operações Testadas
- ✅ **SELECT** - Visualização de dados
- ✅ **INSERT** - Criação de registros
- ✅ **UPDATE** - Atualização de dados
- ✅ **DELETE** - Exclusão de registros

#### Cenários de Segurança
- ✅ Isolamento de dados por usuário
- ✅ Prevenção de ataques de injeção SQL
- ✅ Proteção contra escalação de privilégios
- ✅ Prevenção de information disclosure
- ✅ Proteção contra race conditions
- ✅ Validação de constraints com RLS

## Como Executar os Testes

### 🚀 Execução Completa
```bash
# Executar todos os testes de RLS com validação completa
npm run test:rls
```

### 🧪 Execução Individual
```bash
# Testes básicos de políticas
npm run test:rls:basic

# Testes de cenários edge case
npm run test:rls:edge

# Testes de performance
npm run test:rls:performance

# Gerar relatório de cobertura
npm run test:rls:coverage
```

### 🔧 Execução Manual com Jest
```bash
# Executar arquivo específico
npx jest __tests__/database/rls-policies.test.ts --verbose

# Executar com watch mode
npx jest __tests__/database/ --watch

# Executar com coverage
npx jest __tests__/database/ --coverage
```

## Pré-requisitos

### 📋 Variáveis de Ambiente
Certifique-se de que as seguintes variáveis estão configuradas no `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_de_servico
```

### 🗄️ Banco de Dados
- Supabase configurado e acessível
- Migrações aplicadas (especialmente a migração 016)
- Políticas RLS implementadas
- Triggers e funções criados

### 📦 Dependências
```bash
npm install @supabase/supabase-js
npm install --save-dev jest @types/jest
```

## Estrutura dos Testes

### 🔒 Testes Básicos de RLS (`rls-policies.test.ts`)

#### Cenários Testados por Tabela:

**Tabela `usuarios`:**
- ✅ Usuário vê apenas seu próprio perfil
- ❌ Usuário não vê perfil de outros
- ✅ Usuário pode atualizar seu perfil
- ❌ Usuário não pode atualizar perfil de outros
- ❌ Usuários anônimos não veem perfis

**Tabela `eventos`:**
- ✅ Todos veem eventos públicos
- ✅ Organizador pode criar/atualizar/deletar eventos
- ❌ Outros usuários não podem modificar eventos
- ✅ Usuários anônimos veem lista de eventos

**Tabela `presencas`:**
- ✅ Todos veem lista de participantes
- ✅ Usuário pode confirmar/cancelar sua presença
- ❌ Usuário não pode modificar presença de outros

**Tabela `comentarios`:**
- ✅ Todos veem comentários
- ✅ Usuário pode criar/editar/deletar seus comentários
- ❌ Usuário não pode modificar comentários de outros

**Tabela `curtidas_evento`:**
- ✅ Todos veem curtidas
- ✅ Usuário pode curtir/descurtir eventos
- ❌ Usuário não pode remover curtidas de outros

**Tabela `comunidades`:**
- ✅ Todos veem comunidades públicas
- ❌ Não-membros não veem comunidades privadas
- ✅ Criador/admin pode atualizar comunidade
- ❌ Membros comuns não podem atualizar

**Tabela `membros_comunidade`:**
- ✅ Membros veem outros membros da comunidade
- ✅ Usuário pode se juntar/sair de comunidades
- ✅ Admin pode remover membros
- ❌ Membro comum não pode remover outros

**Tabela `posts_comunidade`:**
- ✅ Membros veem posts da comunidade
- ❌ Não-membros não veem posts
- ✅ Membros podem criar posts
- ❌ Não-membros não podem criar posts

### 🛡️ Testes de Edge Cases (`rls-edge-cases.test.ts`)

#### Ataques de Segurança Testados:

**Injeção SQL:**
- ❌ Injeção através de parâmetros de filtro
- ❌ Bypass via UNION attacks
- ❌ Manipulação de queries através de inputs

**Escalação de Privilégios:**
- ❌ Modificação de `auth.uid()` via headers
- ❌ Uso de service role keys falsas
- ❌ Bypass através de diferentes métodos de auth

**Information Disclosure:**
- ✅ Tempos de resposta consistentes
- ✅ Mensagens de erro padronizadas
- ❌ Enumeração de IDs de usuários

**Race Conditions:**
- ✅ Consistência em operações concorrentes
- ✅ Integridade de contadores
- ✅ Prevenção de duplicatas

### ⚡ Testes de Performance (`rls-performance.test.ts`)

#### Métricas Validadas:

**Consultas Básicas:**
- SELECT simples: < 100ms
- SELECT com filtros: < 150ms
- INSERT/UPDATE/DELETE: < 200ms

**Consultas Complexas:**
- JOINs múltiplos: < 500ms
- Busca full-text: < 300ms
- Agregações: < 400ms

**Carga de Trabalho:**
- 20 consultas simultâneas: < 3s total
- 30 consultas sequenciais: < 100ms média
- Overhead do RLS: < 50ms

## Interpretação dos Resultados

### ✅ Sucesso
- Todos os testes passam
- Performance dentro dos limites esperados
- Cobertura de código > 80%

### ⚠️ Atenção
- Alguns testes de performance próximos ao limite
- Cobertura entre 70-80%
- Warnings de deprecação

### ❌ Falha
- Políticas RLS não funcionando corretamente
- Performance degradada
- Vulnerabilidades de segurança detectadas

## Troubleshooting

### 🔧 Problemas Comuns

#### Erro de Conexão
```
Error: Failed to connect to Supabase
```
**Solução:** Verificar variáveis de ambiente e conectividade

#### Políticas RLS Não Encontradas
```
Error: Policy not found
```
**Solução:** Aplicar migrações do banco de dados

#### Timeout nos Testes
```
Error: Test timeout
```
**Solução:** Verificar performance do banco ou aumentar timeout

#### Usuários de Teste Não Criados
```
Error: Failed to create test users
```
**Solução:** Verificar permissões da service role key

### 🔍 Debug dos Testes

#### Habilitar Logs Detalhados
```bash
DEBUG=true npm run test:rls
```

#### Executar Teste Específico
```bash
npx jest -t "deve permitir que usuário veja apenas seu próprio perfil"
```

#### Verificar Estado do Banco
```sql
-- Verificar políticas ativas
SELECT * FROM pg_policies WHERE tablename = 'usuarios';

-- Verificar usuário atual
SELECT auth.uid(), auth.role();

-- Verificar dados de teste
SELECT count(*) FROM usuarios WHERE email LIKE '%test%';
```

## Contribuindo

### 📝 Adicionando Novos Testes

1. **Identificar cenário** não coberto
2. **Criar teste** no arquivo apropriado
3. **Documentar** comportamento esperado
4. **Executar** e validar resultado
5. **Atualizar** documentação

### 🔄 Atualizando Testes Existentes

1. **Identificar** teste que precisa atualização
2. **Modificar** lógica do teste
3. **Validar** que ainda testa o cenário correto
4. **Executar** suite completa
5. **Documentar** mudanças

### 📊 Melhorando Performance

1. **Identificar** testes lentos
2. **Otimizar** queries ou setup
3. **Validar** que funcionalidade não foi afetada
4. **Atualizar** métricas esperadas

## Documentação Relacionada

- 📚 [Documentação das Políticas RLS](../../docs/database/rls-policies-documentation.md)
- 🏗️ [Design do Banco de Dados](../../.kiro/specs/database-schema/design.md)
- 📋 [Requirements](../../.kiro/specs/database-schema/requirements.md)
- 🔧 [Migrações](../../supabase/migrations/)

## Contato

Para dúvidas sobre os testes de RLS:
- Consulte a documentação das políticas
- Verifique os logs de execução
- Analise os cenários de teste existentes