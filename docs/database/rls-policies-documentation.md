# Documentação das Políticas RLS (Row Level Security)

## Visão Geral

Este documento descreve o comportamento esperado de todas as políticas RLS implementadas no banco de dados do Reuni. As políticas RLS garantem que os dados sejam acessíveis apenas por usuários autorizados, implementando segurança a nível de linha no PostgreSQL.

## Princípios de Segurança

### 1. Princípio do Menor Privilégio
- Usuários têm acesso apenas aos dados que precisam
- Operações são limitadas ao escopo necessário
- Dados sensíveis são protegidos por padrão

### 2. Isolamento de Dados
- Cada usuário vê apenas seus próprios dados pessoais
- Dados públicos são acessíveis a todos
- Dados de comunidades são acessíveis apenas a membros

### 3. Consistência de Segurança
- Políticas são aplicadas consistentemente em todas as operações
- Não há bypass através de diferentes tipos de consulta
- Segurança é mantida mesmo com consultas complexas

## Políticas por Tabela

### Tabela: `usuarios`

#### Comportamento Esperado
- **SELECT**: Usuários veem apenas seu próprio perfil
- **INSERT**: Usuários podem criar apenas seu próprio perfil
- **UPDATE**: Usuários podem atualizar apenas seu próprio perfil
- **DELETE**: Não permitido (perfis são mantidos para integridade)

#### Políticas Implementadas
```sql
-- Visualização do próprio perfil
CREATE POLICY "usuarios_select_own" ON usuarios
    FOR SELECT USING (auth.uid() = id);

-- Criação do próprio perfil
CREATE POLICY "usuarios_insert_own" ON usuarios
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Atualização do próprio perfil
CREATE POLICY "usuarios_update_own" ON usuarios
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
```

#### Cenários de Teste
- ✅ Usuário A vê apenas seu perfil
- ❌ Usuário A não vê perfil do Usuário B
- ✅ Usuário A pode atualizar seu nome/bio
- ❌ Usuário A não pode atualizar dados do Usuário B
- ❌ Usuários anônimos não veem nenhum perfil

### Tabela: `eventos`

#### Comportamento Esperado
- **SELECT**: Todos podem ver eventos públicos
- **INSERT**: Usuários autenticados podem criar eventos
- **UPDATE**: Apenas organizador pode atualizar
- **DELETE**: Apenas organizador pode deletar

#### Políticas Implementadas
```sql
-- Visualização pública de eventos
CREATE POLICY "eventos_select_all" ON eventos
    FOR SELECT USING (true);

-- Criação por usuários autenticados
CREATE POLICY "eventos_insert_authenticated" ON eventos
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = organizador_id);

-- Atualização pelo organizador
CREATE POLICY "eventos_update_owner" ON eventos
    FOR UPDATE USING (auth.uid() = organizador_id);

-- Exclusão pelo organizador
CREATE POLICY "eventos_delete_owner" ON eventos
    FOR DELETE USING (auth.uid() = organizador_id);
```

#### Cenários de Teste
- ✅ Usuários anônimos veem lista de eventos
- ✅ Usuário A cria evento como organizador
- ✅ Organizador atualiza título/descrição do evento
- ❌ Usuário B não pode atualizar evento do Usuário A
- ❌ Usuário B não pode deletar evento do Usuário A

### Tabela: `presencas`

#### Comportamento Esperado
- **SELECT**: Todos podem ver presenças (dados públicos)
- **INSERT**: Usuários podem confirmar apenas sua presença
- **UPDATE**: Usuários podem alterar apenas sua presença
- **DELETE**: Usuários podem cancelar apenas sua presença

#### Políticas Implementadas
```sql
-- Visualização pública de presenças
CREATE POLICY "presencas_select_all" ON presencas
    FOR SELECT USING (true);

-- Confirmação da própria presença
CREATE POLICY "presencas_insert_own" ON presencas
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = usuario_id);

-- Atualização da própria presença
CREATE POLICY "presencas_update_own" ON presencas
    FOR UPDATE USING (auth.uid() = usuario_id);

-- Cancelamento da própria presença
CREATE POLICY "presencas_delete_own" ON presencas
    FOR DELETE USING (auth.uid() = usuario_id);
```

#### Cenários de Teste
- ✅ Todos veem lista de participantes
- ✅ Usuário A confirma presença em evento
- ✅ Usuário A altera status de "confirmado" para "interessado"
- ❌ Usuário A não pode confirmar presença do Usuário B
- ❌ Usuário A não pode cancelar presença do Usuário B

### Tabela: `comentarios`

#### Comportamento Esperado
- **SELECT**: Todos podem ver comentários
- **INSERT**: Usuários autenticados podem comentar
- **UPDATE**: Usuários podem editar apenas seus comentários
- **DELETE**: Usuários podem deletar apenas seus comentários

#### Políticas Implementadas
```sql
-- Visualização pública de comentários
CREATE POLICY "comentarios_select_all" ON comentarios
    FOR SELECT USING (true);

-- Criação de comentários por usuários autenticados
CREATE POLICY "comentarios_insert_authenticated" ON comentarios
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = usuario_id);

-- Edição dos próprios comentários
CREATE POLICY "comentarios_update_own" ON comentarios
    FOR UPDATE USING (auth.uid() = usuario_id);

-- Exclusão dos próprios comentários
CREATE POLICY "comentarios_delete_own" ON comentarios
    FOR DELETE USING (auth.uid() = usuario_id);
```

#### Cenários de Teste
- ✅ Usuários anônimos veem comentários
- ✅ Usuário A comenta em evento
- ✅ Usuário A edita seu comentário
- ❌ Usuário A não pode editar comentário do Usuário B
- ❌ Usuário A não pode deletar comentário do Usuário B

### Tabela: `curtidas_evento`

#### Comportamento Esperado
- **SELECT**: Todos podem ver curtidas (dados públicos)
- **INSERT**: Usuários podem curtir eventos
- **UPDATE**: Não aplicável (tabela simples)
- **DELETE**: Usuários podem remover apenas suas curtidas

#### Políticas Implementadas
```sql
-- Visualização pública de curtidas
CREATE POLICY "curtidas_select_all" ON curtidas_evento
    FOR SELECT USING (true);

-- Curtir eventos
CREATE POLICY "curtidas_insert_own" ON curtidas_evento
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = usuario_id);

-- Remover próprias curtidas
CREATE POLICY "curtidas_delete_own" ON curtidas_evento
    FOR DELETE USING (auth.uid() = usuario_id);
```

#### Cenários de Teste
- ✅ Todos veem número de curtidas
- ✅ Usuário A curte evento
- ✅ Usuário A remove sua curtida
- ❌ Usuário A não pode remover curtida do Usuário B
- ❌ Constraint UNIQUE previne curtidas duplicadas

### Tabela: `comunidades`

#### Comportamento Esperado
- **SELECT**: Comunidades públicas visíveis a todos, privadas apenas a membros
- **INSERT**: Usuários autenticados podem criar comunidades
- **UPDATE**: Apenas criador/admin pode atualizar
- **DELETE**: Apenas criador/admin pode deletar

#### Políticas Implementadas
```sql
-- Visualização baseada em privacidade e membership
CREATE POLICY "comunidades_select_public" ON comunidades
    FOR SELECT USING (
        NOT privada OR 
        auth.uid() IN (
            SELECT usuario_id FROM membros_comunidade 
            WHERE comunidade_id = id
        )
    );

-- Criação por usuários autenticados
CREATE POLICY "comunidades_insert_authenticated" ON comunidades
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = criador_id);

-- Atualização por criador/admin
CREATE POLICY "comunidades_update_admin" ON comunidades
    FOR UPDATE USING (
        auth.uid() = criador_id OR 
        auth.uid() IN (
            SELECT usuario_id FROM membros_comunidade 
            WHERE comunidade_id = id AND role IN ('admin', 'moderator')
        )
    );
```

#### Cenários de Teste
- ✅ Todos veem comunidades públicas
- ❌ Não-membros não veem comunidades privadas
- ✅ Membros veem comunidades privadas que participam
- ✅ Criador atualiza descrição da comunidade
- ✅ Admin/moderador atualiza regras da comunidade
- ❌ Membro comum não pode atualizar comunidade

### Tabela: `membros_comunidade`

#### Comportamento Esperado
- **SELECT**: Membros veem outros membros da mesma comunidade
- **INSERT**: Usuários podem se juntar a comunidades
- **UPDATE**: Próprio registro ou admin/moderador pode alterar
- **DELETE**: Usuário pode sair ou admin pode remover

#### Políticas Implementadas
```sql
-- Visualização para membros da comunidade
CREATE POLICY "membros_select_community_members" ON membros_comunidade
    FOR SELECT USING (
        auth.uid() = usuario_id OR
        auth.uid() IN (
            SELECT usuario_id FROM membros_comunidade mc2 
            WHERE mc2.comunidade_id = comunidade_id
        )
    );

-- Juntar-se a comunidades
CREATE POLICY "membros_insert_own" ON membros_comunidade
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = usuario_id);

-- Sair ou ser removido por admin
CREATE POLICY "membros_delete_own_or_admin" ON membros_comunidade
    FOR DELETE USING (
        auth.uid() = usuario_id OR
        auth.uid() IN (
            SELECT usuario_id FROM membros_comunidade mc2 
            WHERE mc2.comunidade_id = comunidade_id 
            AND mc2.role IN ('admin', 'moderator')
        )
    );
```

#### Cenários de Teste
- ✅ Membro A vê outros membros da comunidade
- ❌ Não-membro não vê membros de comunidade privada
- ✅ Usuário se junta a comunidade pública
- ✅ Usuário sai da comunidade
- ✅ Admin remove membro problemático
- ❌ Membro comum não pode remover outros membros

### Tabela: `posts_comunidade`

#### Comportamento Esperado
- **SELECT**: Apenas membros da comunidade veem posts
- **INSERT**: Apenas membros podem criar posts
- **UPDATE**: Autor ou admin/moderador pode editar
- **DELETE**: Autor ou admin/moderador pode deletar

#### Políticas Implementadas
```sql
-- Visualização para membros da comunidade
CREATE POLICY "posts_select_community_members" ON posts_comunidade
    FOR SELECT USING (
        auth.uid() IN (
            SELECT usuario_id FROM membros_comunidade 
            WHERE comunidade_id = posts_comunidade.comunidade_id
        )
    );

-- Criação por membros da comunidade
CREATE POLICY "posts_insert_community_members" ON posts_comunidade
    FOR INSERT TO authenticated WITH CHECK (
        auth.uid() = usuario_id AND
        auth.uid() IN (
            SELECT usuario_id FROM membros_comunidade 
            WHERE comunidade_id = posts_comunidade.comunidade_id
        )
    );
```

#### Cenários de Teste
- ✅ Membro vê posts da comunidade
- ❌ Não-membro não vê posts
- ✅ Membro cria post na comunidade
- ❌ Não-membro não pode criar post
- ✅ Autor edita seu post
- ✅ Admin/moderador remove post inadequado

## Cenários de Segurança Avançados

### 1. Prevenção de Ataques de Injeção SQL
- Políticas RLS são resistentes a injeção SQL
- Parâmetros maliciosos são tratados como valores literais
- Não há execução de código através de filtros

### 2. Prevenção de Escalação de Privilégios
- Headers maliciosos não afetam `auth.uid()`
- Service role keys falsas são rejeitadas
- Não há bypass através de diferentes métodos de autenticação

### 3. Prevenção de Information Disclosure
- Tempos de resposta consistentes para dados existentes/inexistentes
- Mensagens de erro não revelam informações sobre dados
- Enumeração de IDs é prevenida

### 4. Proteção contra Race Conditions
- Constraints UNIQUE previnem duplicatas
- Triggers mantêm consistência de contadores
- Operações concorrentes são tratadas adequadamente

## Métricas de Performance

### Benchmarks Esperados
- **Consultas simples**: < 100ms
- **Consultas com JOINs**: < 500ms
- **Operações de escrita**: < 200ms
- **Consultas complexas**: < 1000ms

### Overhead do RLS
- Overhead adicional: < 50ms
- Performance aceitável mesmo com múltiplas políticas
- Índices otimizados para consultas com RLS

## Monitoramento e Auditoria

### Logs de Segurança
- Tentativas de acesso não autorizado são logadas
- Operações sensíveis são auditadas
- Performance é monitorada continuamente

### Alertas de Segurança
- Múltiplas tentativas de bypass
- Consultas com performance degradada
- Padrões suspeitos de acesso

## Manutenção das Políticas

### Atualizações de Políticas
1. Testar em ambiente de desenvolvimento
2. Validar com dados de teste
3. Aplicar em staging
4. Monitorar performance
5. Deploy em produção

### Validação Contínua
- Testes automatizados executados em CI/CD
- Validação de performance em cada deploy
- Auditoria regular das políticas

## Troubleshooting

### Problemas Comuns

#### 1. Usuário não consegue ver seus dados
- Verificar se `auth.uid()` retorna valor correto
- Confirmar que usuário está autenticado
- Validar se política SELECT está correta

#### 2. Performance degradada
- Verificar se índices estão sendo usados
- Analisar plano de execução das consultas
- Considerar otimização das políticas

#### 3. Dados não são inseridos
- Verificar política INSERT
- Confirmar que `WITH CHECK` está correto
- Validar constraints da tabela

### Comandos de Diagnóstico

```sql
-- Verificar políticas ativas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'nome_da_tabela';

-- Verificar usuário atual
SELECT auth.uid(), auth.role();

-- Analisar plano de execução
EXPLAIN ANALYZE SELECT * FROM tabela WHERE condicao;
```

## Conclusão

As políticas RLS implementadas no Reuni garantem:

1. **Segurança robusta** - Dados protegidos a nível de linha
2. **Performance adequada** - Overhead mínimo nas consultas
3. **Flexibilidade** - Suporte a diferentes cenários de uso
4. **Manutenibilidade** - Políticas claras e bem documentadas

A implementação segue as melhores práticas de segurança e é validada através de testes automatizados abrangentes.