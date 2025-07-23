-- ⚙️ Triggers e Funções - Sistema de Comunidades
-- Este script cria triggers para manter contadores atualizados

-- ========================================
-- 1. FUNÇÃO PARA ATUALIZAR CONTADOR DE MEMBROS
-- ========================================

CREATE OR REPLACE FUNCTION update_membros_count()
RETURNS TRIGGER AS $
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE comunidades 
    SET membros_count = membros_count + 1 
    WHERE id = NEW.comunidade_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE comunidades 
    SET membros_count = GREATEST(0, membros_count - 1)
    WHERE id = OLD.comunidade_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$ LANGUAGE plpgsql;

-- ========================================
-- 2. TRIGGER PARA CONTADOR DE MEMBROS
-- ========================================

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS trigger_update_membros_count ON membros_comunidade;

-- Criar novo trigger
CREATE TRIGGER trigger_update_membros_count
  AFTER INSERT OR DELETE ON membros_comunidade
  FOR EACH ROW EXECUTE FUNCTION update_membros_count();

-- ========================================
-- 3. FUNÇÃO PARA ATUALIZAR CONTADOR DE EVENTOS
-- ========================================

CREATE OR REPLACE FUNCTION update_eventos_count()
RETURNS TRIGGER AS $
BEGIN
  IF TG_OP = 'INSERT' AND NEW.comunidade_id IS NOT NULL THEN
    UPDATE comunidades 
    SET eventos_count = eventos_count + 1 
    WHERE id = NEW.comunidade_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' AND OLD.comunidade_id IS NOT NULL THEN
    UPDATE comunidades 
    SET eventos_count = GREATEST(0, eventos_count - 1)
    WHERE id = OLD.comunidade_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.comunidade_id IS DISTINCT FROM NEW.comunidade_id THEN
      IF OLD.comunidade_id IS NOT NULL THEN
        UPDATE comunidades 
        SET eventos_count = GREATEST(0, eventos_count - 1)
        WHERE id = OLD.comunidade_id;
      END IF;
      IF NEW.comunidade_id IS NOT NULL THEN
        UPDATE comunidades 
        SET eventos_count = eventos_count + 1 
        WHERE id = NEW.comunidade_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$ LANGUAGE plpgsql;

-- ========================================
-- 4. TRIGGER PARA CONTADOR DE EVENTOS
-- ========================================

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS trigger_update_eventos_count ON eventos;

-- Criar novo trigger
CREATE TRIGGER trigger_update_eventos_count
  AFTER INSERT OR UPDATE OR DELETE ON eventos
  FOR EACH ROW EXECUTE FUNCTION update_eventos_count();

-- ========================================
-- 5. ATUALIZAR CONTADORES EXISTENTES
-- ========================================

-- Recalcular contadores para dados existentes
UPDATE comunidades SET 
  membros_count = (
    SELECT COUNT(*) 
    FROM membros_comunidade 
    WHERE comunidade_id = comunidades.id 
    AND status = 'ativo'
  ),
  eventos_count = (
    SELECT COUNT(*) 
    FROM eventos 
    WHERE comunidade_id = comunidades.id
  );

-- ========================================
-- 6. VERIFICAÇÃO FINAL
-- ========================================

DO $$ 
DECLARE
    total_triggers INTEGER;
    total_functions INTEGER;
    rec RECORD;
BEGIN
    SELECT COUNT(*) INTO total_triggers 
    FROM information_schema.triggers 
    WHERE event_object_table IN ('comunidades', 'membros_comunidade', 'eventos');
    
    SELECT COUNT(*) INTO total_functions 
    FROM information_schema.routines 
    WHERE routine_name IN ('update_membros_count', 'update_eventos_count');
    
    RAISE NOTICE '⚙️ Triggers e funções configurados!';
    RAISE NOTICE '📊 Triggers ativos: %', total_triggers;
    RAISE NOTICE '🔧 Funções criadas: %', total_functions;
    
    -- Mostrar contadores atualizados
    FOR rec IN 
        SELECT nome, membros_count, eventos_count 
        FROM comunidades 
        ORDER BY created_at DESC 
        LIMIT 3
    LOOP
        RAISE NOTICE '   - %: % membros, % eventos', rec.nome, rec.membros_count, rec.eventos_count;
    END LOOP;
END $$;