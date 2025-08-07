# Requirements Document

## Introduction

Esta spec visa resolver os problemas fundamentais do sistema de autenticação do Reuni, criando uma arquitetura robusta e confiável. Os problemas identificados incluem: falhas no callback de autenticação, inconsistências entre tabelas de usuários, loops infinitos de redirecionamento, políticas RLS inadequadas, e falta de middleware de proteção de rotas. O objetivo é criar um sistema de autenticação enterprise-grade que seja seguro, confiável e ofereça uma experiência de usuário consistente.

## Requirements

### Requirement 1: Middleware de Autenticação Robusto

**User Story:** Como desenvolvedor do sistema, eu quero um middleware de autenticação server-side que proteja rotas automaticamente, para que o sistema seja seguro e não dependa apenas de verificações client-side.

#### Acceptance Criteria

1. WHEN uma requisição é feita para qualquer rota protegida THEN o middleware SHALL verificar a sessão no servidor antes de permitir acesso
2. WHEN um usuário não autenticado tenta acessar rota protegida THEN o sistema SHALL redirecionar para login preservando a URL de destino
3. WHEN um usuário autenticado tenta acessar página de login THEN o sistema SHALL redirecionar para a página principal
4. WHEN há erro na verificação de sessão THEN o sistema SHALL ter fallback seguro sem quebrar a aplicação
5. WHEN o middleware executa THEN ele SHALL usar cookies seguros para gerenciar tokens JWT

### Requirement 2: Sincronização Robusta de Dados de Usuário

**User Story:** Como usuário do sistema, eu quero que meus dados sejam consistentes entre a autenticação e o perfil, para que não haja conflitos ou dados perdidos.

#### Acceptance Criteria

1. WHEN um usuário é criado no auth.users THEN o sistema SHALL automaticamente criar entrada correspondente na tabela usuarios
2. WHEN há falha na criação do perfil THEN o sistema SHALL implementar retry automático com fallback
3. WHEN um usuário faz login THEN o sistema SHALL verificar consistência entre auth.users e usuarios
4. WHEN há inconsistência de dados THEN o sistema SHALL sincronizar automaticamente sem interromper o fluxo
5. WHEN um usuário atualiza perfil THEN as mudanças SHALL ser refletidas em ambas as tabelas quando aplicável

### Requirement 3: Callback de Autenticação Confiável

**User Story:** Como usuário que clica no link de confirmação de email, eu quero ser redirecionado corretamente sem erros, para que possa acessar a plataforma imediatamente.

#### Acceptance Criteria

1. WHEN um usuário clica no link de confirmação THEN o callback SHALL processar a confirmação sem erros 406/409
2. WHEN o callback é processado THEN o sistema SHALL determinar corretamente se é usuário novo ou existente
3. WHEN há erro no callback THEN o sistema SHALL ter fallback que não deixa usuário preso em loop
4. WHEN o callback é bem-sucedido THEN o sistema SHALL redirecionar baseado no estado real do perfil do usuário
5. WHEN o link de confirmação expira THEN o sistema SHALL oferecer opção clara para reenviar

### Requirement 4: Políticas RLS Adequadas

**User Story:** Como administrador do sistema, eu quero que as políticas de segurança do banco permitam operações legítimas mas bloqueiem acessos não autorizados, para manter a segurança dos dados.

#### Acceptance Criteria

1. WHEN um usuário autenticado acessa seus próprios dados THEN as políticas RLS SHALL permitir SELECT, INSERT, UPDATE
2. WHEN um usuário tenta acessar dados de outros usuários THEN as políticas RLS SHALL bloquear o acesso
3. WHEN há operação de criação de usuário THEN a política SHALL permitir INSERT apenas para o próprio usuário
4. WHEN há erro de política RLS THEN o sistema SHALL logar detalhes para debug sem expor informações sensíveis
5. WHEN as políticas são aplicadas THEN elas SHALL ser testadas com diferentes cenários de usuário

### Requirement 5: Proteção Contra Loops Infinitos

**User Story:** Como usuário do sistema, eu quero navegar entre páginas sem ficar preso em loops de redirecionamento, para ter uma experiência fluida.

#### Acceptance Criteria

1. WHEN um usuário é redirecionado THEN o sistema SHALL verificar se não está criando loop antes de executar
2. WHEN há risco de loop THEN o sistema SHALL quebrar o ciclo com fallback seguro
3. WHEN um usuário acessa página protegida THEN o guard SHALL verificar apenas uma vez por sessão
4. WHEN há múltiplos guards ativos THEN eles SHALL coordenar para evitar conflitos
5. WHEN um guard falha THEN o sistema SHALL permitir acesso com log de erro ao invés de loop

### Requirement 6: Tratamento Robusto de Erros

**User Story:** Como usuário do sistema, eu quero receber mensagens de erro claras e ter opções de recuperação quando algo dá errado, para não ficar bloqueado.

#### Acceptance Criteria

1. WHEN há erro de autenticação THEN o sistema SHALL mostrar mensagem específica e ação de recuperação
2. WHEN há erro de rede THEN o sistema SHALL implementar retry automático com backoff exponencial
3. WHEN há erro de banco de dados THEN o sistema SHALL logar detalhes técnicos mas mostrar mensagem amigável ao usuário
4. WHEN há erro crítico THEN o sistema SHALL ter página de fallback que permite ao usuário tentar novamente
5. WHEN erros são logados THEN eles SHALL incluir contexto suficiente para debug sem expor dados sensíveis

### Requirement 7: Experiência de Onboarding Consistente

**User Story:** Como novo usuário, eu quero um fluxo de onboarding claro e consistente que me guie pelos primeiros passos na plataforma.

#### Acceptance Criteria

1. WHEN um novo usuário confirma email THEN o sistema SHALL redirecionar para página de boas-vindas personalizada
2. WHEN um usuário existente faz login THEN o sistema SHALL pular onboarding e ir direto para aplicação
3. WHEN um usuário tem perfil incompleto THEN o sistema SHALL guiá-lo para completar informações necessárias
4. WHEN o onboarding é completado THEN o sistema SHALL marcar usuário como onboarded e não mostrar novamente
5. WHEN há erro no onboarding THEN o usuário SHALL poder pular e completar depois sem ficar bloqueado