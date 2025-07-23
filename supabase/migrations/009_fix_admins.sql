-- 🔧 Correção: Adicionar Criadores como Admins

-- 1. Verificar comunidades sem admin
SELECT 
    c.nome,
    c.criador_id,
    u.nome as criador_nome
FROM comunidades c
JOIN usuarios u ON c.criador_id = u.id
WHERE NOT EXISTS (
    SELECT 1 FROM membros_comunidade mc 
    WHERE mc.comunidade_id = c.id 
    AND mc.papel = 'admin' 
    AND mc.status = 'ativo'
);

-- 2. Inserir criadores como admins das suas comunidades
INSERT INTO membros_comunidade (comunidade_id, usuario_id, papel, status)
SELECT 
    c.id, 
    c.criador_id, 
    'admin', 
    'ativo'
FROM comunidades c
WHERE NOT EXISTS (
    SELECT 1 FROM membros_comunidade mc 
    WHERE mc.comunidade_id = c.id 
    AND mc.usuario_id = c.criador_id
)
ON CONFLICT (comunidade_id, usuario_id) 
DO UPDATE SET 
    papel = 'admin',
    status = 'ativo';

-- 3. Verificar se foi corrigido
SELECT 'VERIFICAÇÃO PÓS-CORREÇÃO:' as info;
SELECT 
    c.nome,
    u.nome as criador,
    mc.papel,
    mc.status
FROM comunidades c
JOIN usuarios u ON c.criador_id = u.id
JOIN membros_comunidade mc ON c.id = mc.comunidade_id AND c.criador_id = mc.usuario_id
ORDER BY c.created_at DESC;

-- 4. Atualizar contadores
UPDATE comunidades SET 
  membros_count = (
    SELECT COUNT(*) 
    FROM membros_comunidade 
    WHERE comunidade_id = comunidades.id 
    AND status = 'ativo'
  );

-- 5. Status final
SELECT 
    'STATUS FINAL:' as info,
    (SELECT COUNT(*) FROM comunidades) as total_comunidades,
    (SELECT COUNT(*) FROM membros_comunidade WHERE status = 'ativo') as membros_ativos,
    (SELECT COUNT(*) FROM membros_comunidade WHERE papel = 'admin' AND status = 'ativo') as admins_ativos;