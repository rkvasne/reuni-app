# Padrões de Consulta Otimizados - Reuni

## Visão Geral

Este documento define os padrões de consulta otimizados implementados no banco de dados do Reuni, incluindo estratégias de performance, uso de índices e views materializadas.

## 1. Consultas de Eventos Otimizadas

### 1.1 Busca de Eventos por Localização e Data

**Padrão Otimizado:**
```sql
-- Usa índice composto idx_eventos_data_cidade
SELECT id, titulo, data, local, categoria, participantes_count, likes_count
FROM eventos 
WHERE cidade = $1 
  AND data >= $2 
  AND status = 'ativo'
ORDER BY data, likes_count DESC
LIMIT 20;
```

**Índices Utilizados:**
- `idx_eventos_data_cidade` (data, cidade)
- `idx_eventos_categoria_status` (categoria, status)

**Performance Esperada:** < 50ms para até 10.000 eventos

### 1.2 Eventos Populares com Estatísticas

**Padrão Otimizado (com View Materializada):**
```sql
-- Usa view materializada mv_eventos_stats
SELECT id, titulo, data, cidade, categoria, 
       organizador_nome, comunidade_nome, 
       popularidade_score
FROM mv_eventos_stats 
WHERE periodo IN ('hoje', 'esta_semana')
ORDER BY popularidade_score DESC
LIMIT 10;
```

**Performance Esperada:** < 20ms (dados pré-calculados)

### 1.3 Eventos com Relacionamentos Completos

**Padrão Otimizado:**
```sql
-- Usa múltiplos índices de foreign keys
SELECT e.id, e.titulo, e.data, e.participantes_count,
       u.nome as organizador_nome,
       c.nome as comunidade_nome,
       COUNT(p.id) as presencas_confirmadas
FROM eventos e
LEFT JOIN usuarios u ON e.organizador_id = u.id
LEFT JOIN comunidades c ON e.comunidade_id = c.id
LEFT JOIN presencas p ON e.id = p.evento_id AND p.status = 'confirmado'
WHERE e.status = 'ativo'
GROUP BY e.id, u.nome, c.nome
ORDER BY e.data
LIMIT 20;
```

**Índices Utilizados:**
- `idx_eventos_organizador_id`
- `idx_eventos_comunidade_id`
- `idx_presencas_evento_id`
- `idx_presencas_status`

## 2. Consultas de Comunidades Otimizadas

### 2.1 Comunidades Mais Ativas

**Padrão Otimizado (com View Materializada):**
```sql
-- Usa view materializada mv_comunidades_stats
SELECT id, nome, categoria, cidade, 
       membros_count, eventos_ativos_count,
       atividade_score, criador_nome
FROM mv_comunidades_stats 
WHERE NOT privada
ORDER BY atividade_score DESC
LIMIT 20;
```

**Performance Esperada:** < 15ms (dados pré-calculados)

### 2.2 Comunidades por Categoria e Localização

**Padrão Otimizado:**
```sql
-- Usa índice composto idx_comunidades_categoria_privada
SELECT id, nome, descricao, membros_count, eventos_count
FROM comunidades 
WHERE categoria = $1 
  AND cidade = $2 
  AND NOT privada
ORDER BY membros_count DESC
LIMIT 15;
```

**Índices Utilizados:**
- `idx_comunidades_categoria_privada`
- `idx_comunidades_cidade`

## 3. Consultas de Participação e Membership

### 3.1 Verificar Membership do Usuário

**Padrão Otimizado:**
```sql
-- Usa índice composto idx_membros_usuario_status
SELECT comunidade_id, papel, status
FROM membros_comunidade 
WHERE usuario_id = $1 
  AND status = 'ativo';
```

**Performance Esperada:** < 5ms por usuário

### 3.2 Membros de uma Comunidade

**Padrão Otimizado:**
```sql
-- Usa índice composto idx_membros_comunidade_papel
SELECT mc.usuario_id, mc.papel, mc.joined_at,
       u.nome, u.avatar
FROM membros_comunidade mc
JOIN usuarios u ON mc.usuario_id = u.id
WHERE mc.comunidade_id = $1 
  AND mc.status = 'ativo'
ORDER BY 
  CASE mc.papel 
    WHEN 'admin' THEN 1 
    WHEN 'moderator' THEN 2 
    ELSE 3 
  END,
  mc.joined_at;
```

## 4. Feed de Atividades Otimizado

### 4.1 Feed Personalizado do Usuário

**Padrão Otimizado (com View Materializada):**
```sql
-- Usa view materializada mv_feed_atividades
SELECT f.tipo, f.id, f.conteudo, f.created_at,
       f.likes_count, f.comentarios_count,
       u.nome as usuario_nome, c.nome as comunidade_nome
FROM mv_feed_atividades f
JOIN usuarios u ON f.usuario_id = u.id
LEFT JOIN comunidades c ON f.comunidade_id = c.id
WHERE f.comunidade_id IN (
  SELECT comunidade_id 
  FROM membros_comunidade 
  WHERE usuario_id = $1 AND status = 'ativo'
)
ORDER BY f.created_at DESC
LIMIT 50;
```

**Performance Esperada:** < 30ms para feed completo

## 5. Consultas de Busca e Filtros

### 5.1 Busca Full-Text em Eventos

**Padrão Otimizado:**
```sql
-- Usa índice GIN para busca em texto
SELECT id, titulo, descricao, data, cidade, categoria,
       ts_rank(to_tsvector('portuguese', titulo || ' ' || coalesce(descricao, '')), 
               plainto_tsquery('portuguese', $1)) as relevancia
FROM eventos 
WHERE to_tsvector('portuguese', titulo || ' ' || coalesce(descricao, '')) 
      @@ plainto_tsquery('portuguese', $1)
  AND status = 'ativo'
  AND data >= CURRENT_DATE
ORDER BY relevancia DESC, data
LIMIT 20;
```

**Índices Utilizados:**
- `idx_eventos_texto` (GIN index)
- `idx_eventos_status`

### 5.2 Filtros Avançados com Tags

**Padrão Otimizado:**
```sql
-- Usa índice GIN para arrays
SELECT id, titulo, data, cidade, tags, categoria
FROM eventos 
WHERE tags && $1::text[]  -- Array overlap
  AND categoria = ANY($2::text[])
  AND data BETWEEN $3 AND $4
  AND status = 'ativo'
ORDER BY data, likes_count DESC;
```

**Índices Utilizados:**
- `idx_eventos_tags` (GIN index)
- `idx_eventos_categoria_status`

## 6. Estratégias de Cache e Performance

### 6.1 Views Materializadas

**Views Implementadas:**
- `mv_eventos_stats`: Estatísticas de eventos com scores pré-calculados
- `mv_comunidades_stats`: Estatísticas de comunidades com atividade
- `mv_feed_atividades`: Feed agregado dos últimos 30 dias

**Refresh Strategy:**
```sql
-- Refresh automático via triggers
-- Refresh manual quando necessário
SELECT refresh_materialized_views();
```

### 6.2 Índices Estratégicos

**Índices Compostos Principais:**
- `idx_eventos_data_cidade`: Para consultas por localização e data
- `idx_eventos_categoria_status`: Para filtros por categoria
- `idx_membros_comunidade_papel`: Para consultas de membership
- `idx_presencas_usuario_status`: Para participações do usuário

**Índices GIN para Arrays e Texto:**
- `idx_eventos_tags`: Para busca por tags
- `idx_eventos_texto`: Para busca full-text
- `idx_usuarios_interesses`: Para matching de interesses

### 6.3 Contadores Automáticos

**Triggers Implementados:**
- `update_evento_participantes_count()`: Atualiza contador de participantes
- `update_comunidade_membros_count()`: Atualiza contador de membros
- `update_evento_likes_count()`: Atualiza contador de likes

## 7. Monitoramento e Análise

### 7.1 Funções de Performance

```sql
-- Estatísticas de tabelas
SELECT * FROM get_performance_stats();

-- Análise de consultas
SELECT * FROM analyze_query_performance();
```

### 7.2 Métricas de Performance

**Targets de Performance:**
- Consultas simples: < 50ms
- Consultas com joins: < 100ms
- Consultas complexas: < 200ms
- Views materializadas: < 20ms

**Monitoramento:**
- Tempo médio de resposta por tipo de consulta
- Uso de índices (hit ratio)
- Tamanho das tabelas e crescimento
- Frequência de refresh das views

## 8. Boas Práticas

### 8.1 Desenvolvimento

1. **Sempre usar índices apropriados** para consultas frequentes
2. **Evitar SELECT \*** em consultas de produção
3. **Usar LIMIT** em consultas que podem retornar muitos resultados
4. **Preferir views materializadas** para dados agregados
5. **Testar performance** com dados realistas

### 8.2 Manutenção

1. **Refresh periódico** das views materializadas
2. **Monitoramento** de queries lentas
3. **Análise regular** do uso de índices
4. **Limpeza** de dados antigos quando apropriado

### 8.3 Escalabilidade

1. **Particionamento** de tabelas grandes (futuro)
2. **Read replicas** para consultas de leitura
3. **Connection pooling** adequado
4. **Cache de aplicação** para dados frequentes

## 9. Troubleshooting

### 9.1 Consultas Lentas

**Diagnóstico:**
```sql
-- Verificar plano de execução
EXPLAIN ANALYZE SELECT ...;

-- Verificar uso de índices
SELECT * FROM pg_stat_user_indexes;
```

**Soluções Comuns:**
- Adicionar índices faltantes
- Otimizar condições WHERE
- Usar views materializadas
- Revisar joins desnecessários

### 9.2 Problemas de Índices

**Verificação:**
```sql
-- Índices não utilizados
SELECT * FROM pg_stat_user_indexes WHERE idx_scan = 0;

-- Tamanho dos índices
SELECT indexname, pg_size_pretty(pg_relation_size(indexname::regclass))
FROM pg_indexes WHERE schemaname = 'public';
```

## 10. Roadmap de Otimizações

### Fase Atual (Implementada)
- ✅ Índices básicos e compostos
- ✅ Views materializadas principais
- ✅ Contadores automáticos
- ✅ Funções de monitoramento

### Próximas Fases
- 🔄 Particionamento de tabelas grandes
- 🔄 Cache de consultas frequentes
- 🔄 Otimização de RLS policies
- 🔄 Análise automática de performance

---

**Última atualização:** 06/08/2025  
**Versão:** 1.0  
**Responsável:** Database Schema Spec - Task 15