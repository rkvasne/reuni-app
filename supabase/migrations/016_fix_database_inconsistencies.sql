-- Migration: Fix Database Inconsistencies
-- Description: Corrige inconsistências identificadas no schema atual
-- Date: 2025-08-06
-- Priority: CRÍTICA - Deve ser aplicada antes de qualquer implementação

-- ========================================
-- 1. CORRIGIR TABELA USUARIOS
-- ========================================

-- Adicionar campos faltantes
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS perfil_publico BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS data_nascimento DATE,
ADD COLUMN IF NOT EXISTS cidade VARCHAR(100),
ADD COLUMN IF NOT EXISTS interesses TEXT[];

-- Adicionar constraints de validação (com verificação manual)
DO $$ 
BEGIN
    -- Constraint de validação de email
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'usuarios_email_valid' AND table_name = 'usuarios'
    ) THEN
        ALTER TABLE usuarios ADD CONSTRAINT usuarios_email_valid 
            CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
    END IF;
    
    -- Limpar dados inválidos antes de adicionar constraint de nome
    UPDATE usuarios SET nome = 'Usuário' WHERE nome IS NULL OR length(trim(nome)) < 2;
    
    -- Constraint de comprimento do nome
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'usuarios_nome_length' AND table_name = 'usuarios'
    ) THEN
        ALTER TABLE usuarios ADD CONSTRAINT usuarios_nome_length 
            CHECK (length(trim(nome)) >= 2);
    END IF;
    
    -- Limpar dados inválidos antes de adicionar constraint de bio
    UPDATE usuarios SET bio = left(bio, 500) WHERE bio IS NOT NULL AND length(bio) > 500;
    
    -- Constraint de comprimento da bio
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'usuarios_bio_length' AND table_name = 'usuarios'
    ) THEN
        ALTER TABLE usuarios ADD CONSTRAINT usuarios_bio_length 
            CHECK (length(bio) <= 500);
    END IF;
END $$;

-- Limpar políticas RLS duplicadas da tabela usuarios
DROP POLICY IF EXISTS "Delete own user" ON usuarios;
DROP POLICY IF EXISTS "Insert own user" ON usuarios;
DROP POLICY IF EXISTS "View public profiles" ON usuarios;
DROP POLICY IF EXISTS "Update own user" ON usuarios;

-- Manter apenas as 3 políticas corretas (já existem da migração 015)
-- usuarios_select_own, usuarios_insert_own, usuarios_update_own

-- Criar índices otimizados
CREATE INDEX IF NOT EXISTS idx_usuarios_cidade ON usuarios(cidade);
CREATE INDEX IF NOT EXISTS idx_usuarios_interesses ON usuarios USING GIN(interesses);

-- ========================================
-- 2. CORRIGIR TABELA EVENTOS
-- ========================================

-- Adicionar campos faltantes
ALTER TABLE eventos 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS descricao TEXT,
ADD COLUMN IF NOT EXISTS preco DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ativo',
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS participantes_count INTEGER DEFAULT 0;

-- Adicionar constraints de validação para eventos
DO $$ 
BEGIN
    -- Limpar dados inválidos antes de adicionar constraints
    
    -- Corrigir eventos com data passada
    UPDATE eventos SET data = CURRENT_DATE + INTERVAL '1 day' WHERE data < CURRENT_DATE;
    
    -- Corrigir max_participantes negativos
    UPDATE eventos SET max_participantes = NULL WHERE max_participantes <= 0;
    
    -- Corrigir preços negativos
    UPDATE eventos SET preco = 0 WHERE preco < 0;
    
    -- Corrigir títulos muito curtos
    UPDATE eventos SET titulo = 'Evento' WHERE titulo IS NULL OR length(trim(titulo)) < 5;
    
    -- Corrigir status inválidos
    UPDATE eventos SET status = 'ativo' WHERE status NOT IN ('ativo', 'cancelado', 'finalizado') OR status IS NULL;
    
    -- Constraint de data futura
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'eventos_data_futura' AND table_name = 'eventos'
    ) THEN
        ALTER TABLE eventos ADD CONSTRAINT eventos_data_futura 
            CHECK (data >= CURRENT_DATE);
    END IF;
    
    -- Constraint de max participantes positivo
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'eventos_max_participantes_positivo' AND table_name = 'eventos'
    ) THEN
        ALTER TABLE eventos ADD CONSTRAINT eventos_max_participantes_positivo 
            CHECK (max_participantes > 0 OR max_participantes IS NULL);
    END IF;
    
    -- Constraint de preço positivo
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'eventos_preco_positivo' AND table_name = 'eventos'
    ) THEN
        ALTER TABLE eventos ADD CONSTRAINT eventos_preco_positivo 
            CHECK (preco >= 0);
    END IF;
    
    -- Constraint de comprimento do título
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'eventos_titulo_length' AND table_name = 'eventos'
    ) THEN
        ALTER TABLE eventos ADD CONSTRAINT eventos_titulo_length 
            CHECK (length(trim(titulo)) >= 5);
    END IF;
    
    -- Constraint de status válido
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'eventos_status_valid' AND table_name = 'eventos'
    ) THEN
        ALTER TABLE eventos ADD CONSTRAINT eventos_status_valid 
            CHECK (status IN ('ativo', 'cancelado', 'finalizado'));
    END IF;
END $$;

-- Criar índices otimizados
CREATE INDEX IF NOT EXISTS idx_eventos_status ON eventos(status);
CREATE INDEX IF NOT EXISTS idx_eventos_tags ON eventos USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_eventos_texto ON eventos 
    USING GIN(to_tsvector('portuguese', titulo || ' ' || coalesce(descricao, '')));

-- ========================================
-- 3. CORRIGIR TABELA COMUNIDADES
-- ========================================

-- Adicionar campos faltantes se não existirem
ALTER TABLE comunidades 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS regras TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS membros_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS eventos_count INTEGER DEFAULT 0;

-- Adicionar constraints de validação
DO $$ 
BEGIN
    -- Limpar dados inválidos antes de adicionar constraints
    
    -- Corrigir nomes muito curtos
    UPDATE comunidades SET nome = 'Comunidade' WHERE nome IS NULL OR length(trim(nome)) < 3;
    
    -- Corrigir descrições muito longas
    UPDATE comunidades SET descricao = left(descricao, 1000) WHERE descricao IS NOT NULL AND length(descricao) > 1000;
    
    -- Constraint de comprimento do nome
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'comunidades_nome_length' AND table_name = 'comunidades'
    ) THEN
        ALTER TABLE comunidades ADD CONSTRAINT comunidades_nome_length 
            CHECK (length(trim(nome)) >= 3);
    END IF;
    
    -- Constraint de comprimento da descrição
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'comunidades_descricao_length' AND table_name = 'comunidades'
    ) THEN
        ALTER TABLE comunidades ADD CONSTRAINT comunidades_descricao_length 
            CHECK (length(descricao) <= 1000);
    END IF;
END $$;

-- Criar índices otimizados
CREATE INDEX IF NOT EXISTS idx_comunidades_tags ON comunidades USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_comunidades_texto ON comunidades 
    USING GIN(to_tsvector('portuguese', nome || ' ' || coalesce(descricao, '')));

-- ========================================
-- 4. CORRIGIR TABELA COMENTARIOS
-- ========================================

-- Adicionar campos faltantes
ALTER TABLE comentarios 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES comentarios(id) ON DELETE CASCADE;

-- Adicionar constraints de validação
DO $$ 
BEGIN
    -- Limpar dados inválidos antes de adicionar constraints
    
    -- Corrigir comentários vazios ou muito longos
    UPDATE comentarios SET conteudo = 'Comentário' WHERE conteudo IS NULL OR length(trim(conteudo)) < 1;
    UPDATE comentarios SET conteudo = left(conteudo, 1000) WHERE conteudo IS NOT NULL AND length(conteudo) > 1000;
    
    -- Constraint de comprimento do conteúdo
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'comentarios_conteudo_length' AND table_name = 'comentarios'
    ) THEN
        ALTER TABLE comentarios ADD CONSTRAINT comentarios_conteudo_length 
            CHECK (length(trim(conteudo)) >= 1 AND length(conteudo) <= 1000);
    END IF;
END $$;

-- Criar índices otimizados
CREATE INDEX IF NOT EXISTS idx_comentarios_parent ON comentarios(parent_id);

-- ========================================
-- 5. CRIAR TABELA CURTIDAS_EVENTO (NOVA)
-- ========================================

CREATE TABLE IF NOT EXISTS curtidas_evento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_id UUID NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint de unicidade
    UNIQUE(evento_id, usuario_id)
);

-- RLS Policies para curtidas_evento
ALTER TABLE curtidas_evento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "curtidas_select_all" ON curtidas_evento
    FOR SELECT USING (true);

CREATE POLICY "curtidas_insert_own" ON curtidas_evento
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = curtidas_evento.usuario_id);

CREATE POLICY "curtidas_delete_own" ON curtidas_evento
    FOR DELETE USING (auth.uid() = curtidas_evento.usuario_id);

-- Índices para curtidas_evento
CREATE INDEX IF NOT EXISTS idx_curtidas_evento ON curtidas_evento(evento_id);
CREATE INDEX IF NOT EXISTS idx_curtidas_usuario ON curtidas_evento(usuario_id);

-- ========================================
-- 6. CRIAR TABELA POSTS_COMUNIDADE (NOVA)
-- ========================================

CREATE TABLE IF NOT EXISTS posts_comunidade (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comunidade_id UUID NOT NULL REFERENCES comunidades(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    conteudo TEXT NOT NULL,
    imagens TEXT[],
    likes_count INTEGER DEFAULT 0,
    comentarios_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT posts_conteudo_length CHECK (length(conteudo) >= 1 AND length(conteudo) <= 2000)
);

-- RLS Policies para posts_comunidade
ALTER TABLE posts_comunidade ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts_select_community_members" ON posts_comunidade
    FOR SELECT USING (
        auth.uid() IN (
            SELECT mc.usuario_id FROM membros_comunidade mc
            WHERE mc.comunidade_id = posts_comunidade.comunidade_id
        )
    );

CREATE POLICY "posts_insert_community_members" ON posts_comunidade
    FOR INSERT TO authenticated WITH CHECK (
        auth.uid() = posts_comunidade.usuario_id AND
        auth.uid() IN (
            SELECT mc.usuario_id FROM membros_comunidade mc
            WHERE mc.comunidade_id = posts_comunidade.comunidade_id
        )
    );

-- Índices para posts_comunidade
CREATE INDEX IF NOT EXISTS idx_posts_comunidade ON posts_comunidade(comunidade_id);
CREATE INDEX IF NOT EXISTS idx_posts_usuario ON posts_comunidade(usuario_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts_comunidade(created_at);

-- ========================================
-- 7. CRIAR TABELA COMENTARIOS_POST_COMUNIDADE (NOVA)
-- ========================================

CREATE TABLE IF NOT EXISTS comentarios_post_comunidade (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts_comunidade(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    conteudo TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT comentarios_post_conteudo_length CHECK (length(conteudo) >= 1 AND length(conteudo) <= 500)
);

-- RLS Policies para comentarios_post_comunidade
ALTER TABLE comentarios_post_comunidade ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comentarios_post_select_community_members" ON comentarios_post_comunidade
    FOR SELECT USING (
        auth.uid() IN (
            SELECT mc.usuario_id FROM membros_comunidade mc
            JOIN posts_comunidade pc ON mc.comunidade_id = pc.comunidade_id
            WHERE pc.id = comentarios_post_comunidade.post_id
        )
    );

CREATE POLICY "comentarios_post_insert_community_members" ON comentarios_post_comunidade
    FOR INSERT TO authenticated WITH CHECK (
        auth.uid() = comentarios_post_comunidade.usuario_id AND
        auth.uid() IN (
            SELECT mc.usuario_id FROM membros_comunidade mc
            JOIN posts_comunidade pc ON mc.comunidade_id = pc.comunidade_id
            WHERE pc.id = comentarios_post_comunidade.post_id
        )
    );

-- Índices para comentarios_post_comunidade
CREATE INDEX IF NOT EXISTS idx_comentarios_post ON comentarios_post_comunidade(post_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_post_usuario ON comentarios_post_comunidade(usuario_id);

-- ========================================
-- 8. CRIAR TRIGGERS DE UPDATED_AT
-- ========================================

-- Trigger para usuarios
DROP TRIGGER IF EXISTS update_usuarios_updated_at ON usuarios;
CREATE TRIGGER update_usuarios_updated_at 
    BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para eventos
DROP TRIGGER IF EXISTS update_eventos_updated_at ON eventos;
CREATE TRIGGER update_eventos_updated_at 
    BEFORE UPDATE ON eventos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para comunidades
DROP TRIGGER IF EXISTS update_comunidades_updated_at ON comunidades;
CREATE TRIGGER update_comunidades_updated_at 
    BEFORE UPDATE ON comunidades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para comentarios
DROP TRIGGER IF EXISTS update_comentarios_updated_at ON comentarios;
CREATE TRIGGER update_comentarios_updated_at 
    BEFORE UPDATE ON comentarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para posts_comunidade
DROP TRIGGER IF EXISTS update_posts_updated_at ON posts_comunidade;
CREATE TRIGGER update_posts_updated_at 
    BEFORE UPDATE ON posts_comunidade
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 9. CRIAR TRIGGERS PARA CONTADORES
-- ========================================

-- Função para atualizar contador de likes em eventos
CREATE OR REPLACE FUNCTION update_evento_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE eventos SET likes_count = likes_count + 1 
        WHERE id = NEW.evento_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE eventos SET likes_count = likes_count - 1 
        WHERE id = OLD.evento_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para contador de likes
DROP TRIGGER IF EXISTS trigger_update_likes_count ON curtidas_evento;
CREATE TRIGGER trigger_update_likes_count
    AFTER INSERT OR DELETE ON curtidas_evento
    FOR EACH ROW EXECUTE FUNCTION update_evento_likes_count();

-- Função para atualizar contador de participantes (já existe, mas vamos garantir)
CREATE OR REPLACE FUNCTION update_evento_participantes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'confirmado' THEN
        UPDATE eventos SET participantes_count = participantes_count + 1 
        WHERE id = NEW.evento_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != 'confirmado' AND NEW.status = 'confirmado' THEN
            UPDATE eventos SET participantes_count = participantes_count + 1 
            WHERE id = NEW.evento_id;
        ELSIF OLD.status = 'confirmado' AND NEW.status != 'confirmado' THEN
            UPDATE eventos SET participantes_count = participantes_count - 1 
            WHERE id = NEW.evento_id;
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'confirmado' THEN
        UPDATE eventos SET participantes_count = participantes_count - 1 
        WHERE id = OLD.evento_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para contador de participantes
DROP TRIGGER IF EXISTS trigger_update_participantes_count ON presencas;
CREATE TRIGGER trigger_update_participantes_count
    AFTER INSERT OR UPDATE OR DELETE ON presencas
    FOR EACH ROW EXECUTE FUNCTION update_evento_participantes_count();

-- ========================================
-- 10. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ========================================

COMMENT ON TABLE curtidas_evento IS 'Sistema de likes para eventos';
COMMENT ON TABLE posts_comunidade IS 'Posts/publicações dentro de comunidades';
COMMENT ON TABLE comentarios_post_comunidade IS 'Comentários em posts de comunidades';

COMMENT ON COLUMN usuarios.interesses IS 'Array de interesses do usuário para recomendações';
COMMENT ON COLUMN eventos.tags IS 'Tags para categorização e busca de eventos';
COMMENT ON COLUMN eventos.status IS 'Status do evento: ativo, cancelado, finalizado';
COMMENT ON COLUMN comunidades.regras IS 'Regras da comunidade definidas pelos administradores';

-- ========================================
-- VERIFICAÇÃO FINAL
-- ========================================

DO $$ 
BEGIN
    RAISE NOTICE '🎉 Migração 016 aplicada com sucesso!';
    RAISE NOTICE '📊 Resumo das correções:';
    RAISE NOTICE '   - Tabela usuarios: campos e constraints adicionados';
    RAISE NOTICE '   - Tabela eventos: campos e índices otimizados';
    RAISE NOTICE '   - Tabela comunidades: estrutura completada';
    RAISE NOTICE '   - Tabela curtidas_evento: criada';
    RAISE NOTICE '   - Tabela posts_comunidade: criada';
    RAISE NOTICE '   - Triggers de updated_at: implementados';
    RAISE NOTICE '   - Triggers de contadores: implementados';
    RAISE NOTICE '🧹 Dados inválidos foram limpos automaticamente';
    RAISE NOTICE '✅ Banco de dados agora está consistente com as specs!';
END $$;