# Otimização de Performance - Reuni App

Este documento consolida todas as otimizações de performance implementadas no projeto Reuni, incluindo otimizações de banco de dados, consultas e padrões de código.

## 📊 Visão Geral

### Status das Otimizações
- **Migração 019**: Otimizações de consultas e relacionamentos ✅
- **Índices Estratégicos**: Implementados ✅
- **Views Materializadas**: Criadas ✅
- **Padrões de Consulta**: Documentados ✅
- **Monitoramento**: Scripts de validação ✅

### Impacto Esperado
- **Melhoria de 80-95%** no tempo de resposta das consultas
- **Redução significativa** na carga do banco de dados
- **Experiência do usuário** mais fluida e responsiva

---

## 🗄️ Otimizações de Banco de Dados

### Migração 019: Otimizações de Consultas
**Arquivo**: `supabase/migrations/019_optimize_queries_and_relationships.sql`

#### Índices Implementados

1. **Índices Compostos**
```sql
-- Eventos por data e categoria
CREATE INDEX IF NOT EXISTS idx_eventos_data_categoria 
ON eventos(data, categoria) WHERE ativo = true;

-- Presenças por evento e status
CREATE INDEX IF NOT EXISTS idx_presencas_evento_status 
ON presencas(evento_id, status);

-- Membros por comunidade e role
CREATE INDEX IF NOT EXISTS idx_membros_comunidade_role 
ON membros_comunidade(comunidade_id, role);
```

2. **Índices GIN para Arrays e Busca**
```sql
-- Tags de eventos (array)
CREATE INDEX IF NOT EXISTS idx_eventos_tags_gin 
ON eventos USING GIN(tags);

-- Busca full-text em eventos
CREATE INDEX IF NOT EXISTS idx_eventos_search_gin 
ON eventos USING GIN(to_tsvector('portuguese', titulo || ' ' || descricao));
```

3. **Índices Parciais**
```sql
-- Apenas eventos ativos
CREATE INDEX IF NOT EXISTS idx_eventos_ativos 
ON eventos(data, created_at) WHERE ativo = true;

-- Apenas comunidades públicas
CREATE INDEX IF NOT EXISTS idx_comunidades_publicas 
ON comunidades(categoria, created_at) WHERE privada = false;
```

#### Views Materializadas

1. **mv_eventos_stats** - Estatísticas de Eventos
```sql
CREATE MATERIALIZED VIEW mv_eventos_stats AS
SELECT 
    e.id,
    e.titulo,
    e.data,
    e.categoria,
    e.cidade,
    COUNT(p.id) as total_presencas,
    COUNT(CASE WHEN p.status = 'confirmado' THEN 1 END) as confirmados,
    COUNT(CASE WHEN p.status = 'interessado' THEN 1 END) as interessados,
    COUNT(c.id) as total_comentarios,
    COUNT(cu.id) as total_curtidas,
    -- Score de popularidade
    (COUNT(p.id) * 1.0 + COUNT(c.id) * 0.5 + COUNT(cu.id) * 0.3) as popularity_score
FROM eventos e
LEFT JOIN presencas p ON e.id = p.evento_id
LEFT JOIN comentarios c ON e.id = c.evento_id
LEFT JOIN curtidas_evento cu ON e.id = cu.evento_id
WHERE e.ativo = true
GROUP BY e.id, e.titulo, e.data, e.categoria, e.cidade;
```

2. **mv_comunidades_stats** - Estatísticas de Comunidades
```sql
CREATE MATERIALIZED VIEW mv_comunidades_stats AS
SELECT 
    c.id,
    c.nome,
    c.categoria,
    c.privada,
    COUNT(mc.id) as total_membros,
    COUNT(CASE WHEN mc.role = 'admin' THEN 1 END) as total_admins,
    COUNT(pc.id) as total_posts,
    MAX(pc.created_at) as ultimo_post,
    -- Score de atividade
    (COUNT(mc.id) * 2.0 + COUNT(pc.id) * 1.0) as activity_score
FROM comunidades c
LEFT JOIN membros_comunidade mc ON c.id = mc.comunidade_id
LEFT JOIN posts_comunidade pc ON c.id = pc.comunidade_id
GROUP BY c.id, c.nome, c.categoria, c.privada;
```

3. **mv_feed_atividades** - Feed de Atividades
```sql
CREATE MATERIALIZED VIEW mv_feed_atividades AS
SELECT 
    'evento' as tipo,
    e.id,
    e.titulo as titulo,
    e.organizador_id as usuario_id,
    e.created_at,
    e.data as data_evento,
    NULL as comunidade_id
FROM eventos e
WHERE e.ativo = true AND e.created_at > NOW() - INTERVAL '30 days'

UNION ALL

SELECT 
    'post' as tipo,
    pc.id,
    LEFT(pc.conteudo, 100) as titulo,
    pc.usuario_id,
    pc.created_at,
    NULL as data_evento,
    pc.comunidade_id
FROM posts_comunidade pc
WHERE pc.created_at > NOW() - INTERVAL '30 days'

ORDER BY created_at DESC;
```

#### Funções de Manutenção

1. **refresh_materialized_views()** - Atualização das Views
```sql
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_eventos_stats;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_comunidades_stats;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_feed_atividades;
END;
$$ LANGUAGE plpgsql;
```

2. **get_performance_stats()** - Estatísticas de Performance
```sql
CREATE OR REPLACE FUNCTION get_performance_stats()
RETURNS TABLE(
    table_name text,
    total_rows bigint,
    table_size text,
    index_size text,
    total_size text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname||'.'||tablename as table_name,
        n_tup_ins + n_tup_upd + n_tup_del as total_rows,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
        pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) + pg_indexes_size(schemaname||'.'||tablename)) as total_size
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql;
```

#### Triggers de Manutenção

1. **Refresh Automático das Views**
```sql
CREATE OR REPLACE FUNCTION trigger_refresh_views()
RETURNS trigger AS $$
BEGIN
    -- Refresh assíncrono das views materializadas
    PERFORM pg_notify('refresh_views', TG_TABLE_NAME);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers para tabelas principais
CREATE TRIGGER eventos_refresh_trigger
    AFTER INSERT OR UPDATE OR DELETE ON eventos
    FOR EACH STATEMENT EXECUTE FUNCTION trigger_refresh_views();

CREATE TRIGGER presencas_refresh_trigger
    AFTER INSERT OR UPDATE OR DELETE ON presencas
    FOR EACH STATEMENT EXECUTE FUNCTION trigger_refresh_views();
```

---

## 🔍 Padrões de Consulta Otimizados

### Consultas de Eventos

#### 1. Lista de Eventos com Estatísticas
```sql
-- OTIMIZADA: Usa view materializada
SELECT 
    id,
    titulo,
    data,
    categoria,
    cidade,
    total_presencas,
    confirmados,
    popularity_score
FROM mv_eventos_stats
WHERE data >= CURRENT_DATE
ORDER BY popularity_score DESC, data ASC
LIMIT 20;
```

#### 2. Eventos por Categoria e Localização
```sql
-- OTIMIZADA: Usa índice composto
SELECT e.*, es.total_presencas, es.confirmados
FROM eventos e
JOIN mv_eventos_stats es ON e.id = es.id
WHERE e.categoria = $1 
  AND e.cidade = $2 
  AND e.data >= CURRENT_DATE
  AND e.ativo = true
ORDER BY e.data ASC, es.popularity_score DESC;
```

#### 3. Busca de Eventos por Texto
```sql
-- OTIMIZADA: Usa índice GIN full-text
SELECT e.*, es.total_presencas
FROM eventos e
JOIN mv_eventos_stats es ON e.id = es.id
WHERE to_tsvector('portuguese', e.titulo || ' ' || e.descricao) @@ plainto_tsquery('portuguese', $1)
  AND e.ativo = true
ORDER BY ts_rank(to_tsvector('portuguese', e.titulo || ' ' || e.descricao), plainto_tsquery('portuguese', $1)) DESC;
```

### Consultas de Comunidades

#### 1. Lista de Comunidades Ativas
```sql
-- OTIMIZADA: Usa view materializada
SELECT 
    id,
    nome,
    categoria,
    total_membros,
    total_posts,
    ultimo_post,
    activity_score
FROM mv_comunidades_stats
WHERE NOT privada
ORDER BY activity_score DESC, total_membros DESC
LIMIT 20;
```

#### 2. Comunidades do Usuário
```sql
-- OTIMIZADA: Usa índice em membros_comunidade
SELECT c.*, cs.total_membros, cs.total_posts
FROM comunidades c
JOIN membros_comunidade mc ON c.id = mc.comunidade_id
JOIN mv_comunidades_stats cs ON c.id = cs.id
WHERE mc.usuario_id = $1
ORDER BY mc.created_at DESC;
```

### Feed de Atividades

#### 1. Feed Personalizado
```sql
-- OTIMIZADA: Usa view materializada + filtros eficientes
SELECT *
FROM mv_feed_atividades fa
WHERE (
    -- Eventos de comunidades que o usuário participa
    (fa.tipo = 'evento' AND fa.comunidade_id IN (
        SELECT comunidade_id FROM membros_comunidade WHERE usuario_id = $1
    ))
    OR
    -- Posts de comunidades que o usuário participa
    (fa.tipo = 'post' AND fa.comunidade_id IN (
        SELECT comunidade_id FROM membros_comunidade WHERE usuario_id = $1
    ))
    OR
    -- Eventos públicos na cidade do usuário
    (fa.tipo = 'evento' AND fa.comunidade_id IS NULL)
)
ORDER BY created_at DESC
LIMIT 50;
```

---

## 📊 Métricas de Performance

### Benchmarks Atuais

#### Antes das Otimizações
- Consulta básica de eventos: 414ms (10 resultados)
- Consulta com joins: 3852ms (5 resultados)
- Consulta de comunidades: 197ms (0 resultados)
- Tempo médio: 1487.67ms

#### Após Otimizações (Esperado)
- Consultas básicas: < 50ms (melhoria de 88%)
- Consultas com joins: < 100ms (melhoria de 97%)
- Consultas de comunidades: < 30ms (melhoria de 85%)
- Views materializadas: < 20ms (melhoria de 95%)

### Monitoramento Contínuo

#### Scripts de Validação
```bash
# Testar otimizações
node scripts/test-query-optimizations.js

# Aplicar otimizações
node scripts/apply-query-optimizations.js

# Monitorar performance
SELECT * FROM get_performance_stats();
```

#### Métricas Importantes
1. **Tempo de Resposta**: < 100ms para 95% das consultas
2. **Throughput**: > 1000 consultas/segundo
3. **Uso de CPU**: < 70% em picos
4. **Uso de Memória**: < 80% da RAM disponível
5. **Tamanho dos Índices**: < 30% do tamanho das tabelas

---

## 🔧 Otimizações de Código

### Padrões de Consulta no Frontend

#### 1. Uso de Views Materializadas
```typescript
// ✅ OTIMIZADO: Usa view materializada
const { data: eventos } = await supabase
  .from('mv_eventos_stats')
  .select('*')
  .gte('data', new Date().toISOString())
  .order('popularity_score', { ascending: false })
  .limit(20)

// ❌ NÃO OTIMIZADO: Múltiplas consultas
const { data: eventos } = await supabase
  .from('eventos')
  .select(`
    *,
    presencas(count),
    comentarios(count),
    curtidas_evento(count)
  `)
```

#### 2. Paginação Eficiente
```typescript
// ✅ OTIMIZADO: Paginação com cursor
const { data: eventos } = await supabase
  .from('mv_eventos_stats')
  .select('*')
  .gt('id', lastEventId)
  .order('id')
  .limit(20)

// ❌ NÃO OTIMIZADO: Paginação com OFFSET
const { data: eventos } = await supabase
  .from('eventos')
  .select('*')
  .range(page * 20, (page + 1) * 20 - 1)
```

#### 3. Filtros Inteligentes
```typescript
// ✅ OTIMIZADO: Filtros que usam índices
const { data: eventos } = await supabase
  .from('eventos')
  .select('*')
  .eq('categoria', categoria)
  .eq('cidade', cidade)
  .gte('data', new Date().toISOString())
  .eq('ativo', true)

// ❌ NÃO OTIMIZADO: Filtros que não usam índices
const { data: eventos } = await supabase
  .from('eventos')
  .select('*')
  .ilike('titulo', `%${search}%`)
  .filter('data', 'gte', new Date().toISOString())
```

### Cache Strategies

#### 1. Cache de Consultas Frequentes
```typescript
// Cache de 5 minutos para listas
const CACHE_TTL = 5 * 60 * 1000

export async function getEventosPopulares() {
  const cacheKey = 'eventos_populares'
  const cached = cache.get(cacheKey)
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  
  const { data } = await supabase
    .from('mv_eventos_stats')
    .select('*')
    .order('popularity_score', { ascending: false })
    .limit(20)
  
  cache.set(cacheKey, { data, timestamp: Date.now() })
  return data
}
```

#### 2. Invalidação Inteligente
```typescript
// Invalidar cache quando dados mudam
export async function createEvento(evento: EventoInput) {
  const { data, error } = await supabase
    .from('eventos')
    .insert(evento)
  
  if (!error) {
    // Invalidar caches relacionados
    cache.delete('eventos_populares')
    cache.delete(`eventos_categoria_${evento.categoria}`)
    cache.delete(`eventos_cidade_${evento.cidade}`)
  }
  
  return { data, error }
}
```

---

## 🚀 Próximas Otimizações

### Curto Prazo (2 semanas)
1. **Aplicar migração 019** em produção
2. **Configurar refresh automático** das views materializadas
3. **Implementar cache Redis** para consultas frequentes
4. **Monitorar métricas** de performance em produção

### Médio Prazo (1 mês)
1. **Otimizar políticas RLS** baseado em uso real
2. **Implementar connection pooling** para melhor concorrência
3. **Configurar read replicas** para consultas de leitura
4. **Implementar CDN** para assets estáticos

### Longo Prazo (3 meses)
1. **Particionamento** de tabelas grandes (eventos, comentarios)
2. **Implementar search engine** (Elasticsearch) para busca avançada
3. **Otimizações de imagem** com processamento automático
4. **Análise automática** de performance com alertas

---

## 📋 Checklist de Implementação

### ✅ Concluído
- [x] Análise de planos de execução de consultas críticas
- [x] Criação de índices estratégicos para consultas frequentes
- [x] Implementação de views materializadas para dados agregados
- [x] Funções de manutenção e refresh automático
- [x] Scripts de teste e validação de performance
- [x] Documentação de padrões de consulta otimizados

### 🔄 Em Progresso
- [ ] Aplicação da migração em produção
- [ ] Configuração de monitoramento contínuo
- [ ] Implementação de cache de aplicação
- [ ] Otimização de consultas RLS

### 📋 Pendente
- [ ] Configuração de alertas de performance
- [ ] Implementação de connection pooling
- [ ] Setup de read replicas
- [ ] Análise automática de slow queries

---

**Última Atualização**: 08/08/2025  
**Responsável**: Database Schema Spec - Task 15  
**Status**: Otimizações implementadas, aguardando aplicação em produção  
**Próximo Marco**: Aplicação da migração 019 e monitoramento de resultados