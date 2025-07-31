# 📘 Regras Globais de Desenvolvimento e Conduta para Agentes de IA

Este documento contém as regras fundamentais para garantir segurança, controle e qualidade no uso de agentes de IA (como Cursor, Kiro, Windsurf, Trae) e no desenvolvimento de software em geral. As diretrizes aqui apresentadas são mandatórias e prevalecem sobre qualquer convenção do projeto.

---

## 📑 Índice Geral

1. [⚠️ Regra Máxima de Alteração](#️-regra-máxima-de-alteração)
2. [✅ Boas Práticas de Desenvolvimento](#boas-práticas-de-desenvolvimento)
3. [📂 Quando Carregar Arquivos Complementares](#quando-carregar-arquivos-complementares)

---

## ⚠️ Regra Máxima de Alteração

🖥️ **Sistema Operacional Padrão: Windows 11**
🌐 **Idioma padrão de resposta: sempre utilizar português (pt-BR)**

❌ **Nunca altere partes do código que não foram explicitamente solicitadas.**

### 🔒 Diretrizes Obrigatórias

- ✅ **Informe sempre qual modelo de IA está sendo usado antes de responder.**
- 🔍 **Avalie o tamanho do histórico do chat e, se necessário, sugira iniciar um novo.**
- ❌ **NÃO reescreva funções, componentes ou arquivos inteiros sem solicitação clara.**
- ❌ **NÃO refatore, otimize ou “melhore” o código por conta própria.**
- ❌ **NÃO sugira alterações ou melhorias automáticas.**
- ✅ **Edite apenas o que for claramente pedido. Todo o restante deve ser mantido.**
- ❓ **Se houver qualquer dúvida sobre o escopo, pergunte antes de modificar.**

---

## 🤖 Regras Específicas para Agentes de IA (Cursor, Kiro, Windsurf, Trae)

Estas regras garantem previsibilidade e rastreabilidade ao trabalhar com agentes de inteligência artificial.

### ⚙️ Execução de Comandos

- ❌ **Nunca execute comandos em terminal (shell, bash, node, etc.) sem autorização explícita.**
  Isso inclui comandos de instalação, execução, scripts de banco de dados, automações, etc.

### 🗂️ Criação e Nomeação de Arquivos

- ✅ **Sempre use prefixos numéricos ordenados ao nomear arquivos.**
  Exemplo: `001_criar_tabelas_iniciais.sql`, `002_documentacao.md`

- ❌ **Nunca crie arquivos com sufixos como `_fix`, `_v2`, `_novo`, `_final`, etc.**
  Corrija o arquivo original até que funcione. Evite criar múltiplas versões paralelas.

---

## ✅ Boas Práticas de Desenvolvimento

Diretrizes fundamentais para manter um código limpo, organizado e sustentável.

### 🧠 Princípios Fundamentais

#### Simplicidade
- Prefira sempre soluções simples e diretas.
- Evite complexidade desnecessária.
- Código claro é mais importante que “inteligente”.

#### Responsabilidade Única
- Cada componente, função ou classe deve ter uma única responsabilidade.
- Divida arquivos grandes (>300 linhas) em módulos menores.

#### DRY (Don't Repeat Yourself)
- Extraia lógicas repetidas em funções reutilizáveis.
- Use componentes compartilhados para padrões recorrentes.

#### Manutenibilidade
- Escreva código pensando em quem vai mantê-lo depois.
- Nomenclatura clara, descritiva e sem abreviações.
- Comente apenas o “porquê”, não o “o quê”.

### 🧱 Estrutura e Organização

#### Organização de Arquivos
- Agrupe arquivos por domínio ou recurso.
- Utilize diretórios como `components`, `utils`, `services`, etc.

#### Componentização
- Extraia padrões repetidos em componentes reutilizáveis.
- Separe lógica, dados e renderização.

#### Gerenciamento de Estado
- Mantenha o estado local onde for possível.
- Evite prop drilling excessivo.

### 🧼 Qualidade de Código

#### Nomenclatura
- Descritiva, consistente, sem siglas obscuras.

#### Tratamento de Erros
- Use `try/catch` e trate erros por tipo.
- Exiba mensagens amigáveis ao usuário.

#### Assíncrono
- Use `async/await` com tratamento de exceções.
- Informe o usuário sobre carregamentos.

### 🔐 Segurança Básica

#### Validação de Entrada
- Sempre validar no cliente e no servidor.

#### Proteção de Dados
- Nunca expor segredos no código-fonte.
- Use variáveis de ambiente e HTTPS.

#### Autenticação e Autorização
- Proteja rotas com middleware e RBAC.

### 🎨 UI/UX Essencial

#### Consistência Visual
- Use componentes padronizados.
- Mantenha coerência visual no layout.

#### Acessibilidade
- Use HTML semântico e contraste suficiente.
- Garanta navegação por teclado.

#### Responsividade
- Adapte para diferentes tamanhos de tela.
- Use `rem`, `%`, `vh/vw`.

### 🚀 Performance

#### Renderização
- Evite re-renderizações.
- Use virtualização para listas longas.

#### Recursos
- Otimize imagens, reduza requisições e limpe listeners.

#### Velocidade Percebida
- Use skeleton loaders.
- Priorize conteúdo visível.

---

## 📂 Quando Carregar Arquivos Complementares

Carregue arquivos de regras adicionais conforme o contexto:

- UI/UX: `cursor-frontend-ui.md`
- React: `cursor-frontend-react.md`
- Arquitetura: `cursor-arquitetura.md`
- Segurança: `cursor-seguranca.md`
- Performance: `cursor-performance.md`
- Testes: `cursor-testes.md`
- Backend: `cursor-backend.md`

### Tecnologias específicas

- Next.js: `cursor-nextjs.md`
- TailwindCSS: `cursor-tailwind.md`
- TypeScript: `cursor-typescript.md`
- Bancos de dados: `cursor-sql-nosql.md`

### Modos de trabalho

- Arquiteto: `cursor-modo-arquiteto.md`
- Planejador: `cursor-modo-planejador.md`
- Depurador: `cursor-modo-depurador.md`
