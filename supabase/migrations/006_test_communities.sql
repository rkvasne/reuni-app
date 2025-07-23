-- 🧪 Teste do Sistema de Comunidades

-- ========================================
-- 1. INSERIR COMUNIDADES DE TESTE
-- ========================================

-- ATENÇÃO: Execute apenas se quiser criar comunidades de teste
-- Substitua pelo seu user ID real ou pule esta seção

-- Para encontrar seu user ID:
-- SELECT id, nome, email FROM usuarios LIMIT 5;

-- Exemplo de inserção (descomente e substitua o UUID):
/*
INSERT INTO comunidades (nome, descricao, categoria, tipo, criador_id) VALUES
('Desenvolvedores React', 'Comunidade para desenvolvedores React e Next.js', 'Tecnologia', 'publica', 'SEU-UUID-AQUI'),
('Fotógrafos de Natureza', 'Compartilhe suas melhores fotos da natureza', 'Arte', 'publica', 'SEU-UUID-AQUI'),
('Corredores de São Paulo', 'Grupo de corrida da cidade de São Paulo', 'Esportes', 'publica', 'SEU-UUID-AQUI')
ON CONFLICT DO NOTHING;
*/

-- Mostrar usuários existentes para referência:
SELECT 'USUÁRIOS DISPONÍVEIS:' as info;
SELECT id, nome, email FROM usuarios ORDER BY created_at DESC LIMIT 5;

-- ========================================
-- 2. VERIFICAR DADOS INSERIDOS
-- ========================================

-- Ver comunidades criadas
SELECT 
    id,
    nome,
    categoria,
    tipo,
    membros_count,
    eventos_count,
    created_at
FROM comunidades
ORDER BY created_at DESC
LIMIT 5;

-- Ver membros das comunidades
SELECT 
    c.nome as comunidade,
    u.nome as usuario,
    mc.papel,
    mc.status,
    mc.joined_at
FROM membros_comunidade mc
JOIN comunidades c ON mc.comunidade_id = c.id
JOIN usuarios u ON mc.usuario_id = u.id
ORDER BY mc.joined_at DESC
LIMIT 10;

-- ========================================
-- 3. TESTAR POLÍTICAS RLS
-- ========================================

-- Verificar se RLS está habilitado
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename IN ('comunidades', 'membros_comunidade');

-- Ver políticas ativas
SELECT 
    tablename, 
    policyname, 
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN 'Tem condição'
        ELSE 'Sem condição'
    END as tem_condicao
FROM pg_policies 
WHERE tablename IN ('comunidades', 'membros_comunidade')
ORDER BY tablename, policyname;

-- ========================================
-- 4. TESTAR CONTADORES
-- ========================================

-- Verificar se contadores estão corretos
SELECT 
    c.nome,
    c.membros_count as contador_membros,
    (SELECT COUNT(*) FROM membros_comunidade WHERE comunidade_id = c.id AND status = 'ativo') as membros_reais,
    c.eventos_count as contador_eventos,
    (SELECT COUNT(*) FROM eventos WHERE comunidade_id = c.id) as eventos_reais
FROM comunidades c
ORDER BY c.created_at DESC;

-- ========================================
-- 5. VERIFICAR ESTRUTURA FINAL
-- ========================================

-- Colunas da tabela comunidades
SELECT 'Colunas COMUNIDADES:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'comunidades' 
ORDER BY ordinal_position;

-- Colunas da tabela membros_comunidade
SELECT 'Colunas MEMBROS_COMUNIDADE:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'membros_comunidade' 
ORDER BY ordinal_position;

-- ========================================
-- 6. ESTATÍSTICAS FINAIS
-- ========================================

SELECT 
    'ESTATÍSTICAS FINAIS' as info,
    (SELECT COUNT(*) FROM comunidades) as total_comunidades,
    (SELECT COUNT(*) FROM membros_comunidade WHERE status = 'ativo') as membros_ativos,
    (SELECT COUNT(DISTINCT categoria) FROM comunidades) as categorias_usadas,
    (SELECT COUNT(*) FROM eventos WHERE comunidade_id IS NOT NULL) as eventos_com_comunidade;