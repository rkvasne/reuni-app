# 🗄️ SQL Schema - Sistema de Comunidades

## 📋 Tabelas Necessárias

### 1. Tabela `comunidades`
```sql
-- Verificar se tabela existe e criar apenas se necessário
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'comunidades') THEN
        CREATE TABLE comunidades (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          nome VARCHAR(100) NOT NULL,
          descricao TEXT,
          avatar_url TEXT,
          banner_url TEXT,
          categoria VARCHAR(50) NOT NULL,
          tipo VARCHAR(20) DEFAULT 'publica' CHECK (tipo IN ('publica', 'privada', 'restrita')),
          criador_id UUID REFERENCES usuarios(id) ON DELETE CASCADE NOT NULL,
          membros_count INTEGER DEFAULT 0,
          eventos_count INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- Adicionar colunas que podem estar faltando
ALTER TABLE comunidades 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS categoria VARCHAR(50),
ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'publica',
ADD COLUMN IF NOT EXISTS membros_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS eventos_count INTEGER DEFAULT 0;

-- Adicionar constraint se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'comunidades_tipo_check') THEN
        ALTER TABLE comunidades ADD CONSTRAINT comunidades_tipo_check 
        CHECK (tipo IN ('publica', 'privada', 'restrita'));
    END IF;
END $$;

-- Índices para performance (criar apenas se não existirem)
CREATE INDEX IF NOT EXISTS idx_comunidades_categoria ON comunidades(categoria);
CREATE INDEX IF NOT EXISTS idx_comunidades_criador ON comunidades(criador_id);
CREATE INDEX IF NOT EXISTS idx_comunidades_tipo ON comunidades(tipo);
CREATE INDEX IF NOT EXISTS idx_comunidades_created_at ON comunidades(created_at DESC);
```

### 2. Tabela `membros_comunidade`
```sql
-- Criar tabela apenas se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'membros_comunidade') THEN
        CREATE TABLE membros_comunidade (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          comunidade_id UUID REFERENCES comunidades(id) ON DELETE CASCADE NOT NULL,
          usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE NOT NULL,
          papel VARCHAR(20) DEFAULT 'membro' CHECK (papel IN ('admin', 'moderador', 'membro')),
          status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'pendente', 'banido')),
          joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(comunidade_id, usuario_id)
        );
    END IF;
END $$;

-- Adicionar colunas que podem estar faltando
ALTER TABLE membros_comunidade 
ADD COLUMN IF NOT EXISTS papel VARCHAR(20) DEFAULT 'membro',
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ativo',
ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Adicionar constraints se não existirem
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'membros_comunidade_papel_check') THEN
        ALTER TABLE membros_comunidade ADD CONSTRAINT membros_comunidade_papel_check 
        CHECK (papel IN ('admin', 'moderador', 'membro'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'membros_comunidade_status_check') THEN
        ALTER TABLE membros_comunidade ADD CONSTRAINT membros_comunidade_status_check 
        CHECK (status IN ('ativo', 'pendente', 'banido'));
    END IF;
END $$;

-- Índices para performance (criar apenas se não existirem)
CREATE INDEX IF NOT EXISTS idx_membros_comunidade_id ON membros_comunidade(comunidade_id);
CREATE INDEX IF NOT EXISTS idx_membros_usuario_id ON membros_comunidade(usuario_id);
CREATE INDEX IF NOT EXISTS idx_membros_papel ON membros_comunidade(papel);
CREATE INDEX IF NOT EXISTS idx_membros_status ON membros_comunidade(status);
```

### 3. Atualizar tabela `eventos`
```sql
-- Adicionar coluna de comunidade aos eventos (apenas se não existir)
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS comunidade_id UUID REFERENCES comunidades(id);

-- Índice para eventos por comunidade (criar apenas se não existir)
CREATE INDEX IF NOT EXISTS idx_eventos_comunidade ON eventos(comunidade_id);
```

## 🔐 Políticas RLS (Row Level Security)

### Políticas para `comunidades`
```sql
-- Habilitar RLS
ALTER TABLE comunidades ENABLE ROW LEVEL SECURITY;

-- Ver comunidades públicas ou onde é membro
CREATE POLICY "Users can view communities" ON comunidades
FOR SELECT USING (
  tipo = 'publica' OR 
  id IN (
    SELECT comunidade_id FROM membros_comunidade 
    WHERE usuario_id = auth.uid() AND status = 'ativo'
  )
);

-- Criar comunidades (usuários autenticados)
CREATE POLICY "Users can create communities" ON comunidades
FOR INSERT WITH CHECK (auth.uid() = criador_id);

-- Editar próprias comunidades ou sendo admin
CREATE POLICY "Users can update communities" ON comunidades
FOR UPDATE USING (
  criador_id = auth.uid() OR
  id IN (
    SELECT comunidade_id FROM membros_comunidade 
    WHERE usuario_id = auth.uid() AND papel = 'admin' AND status = 'ativo'
  )
);

-- Deletar próprias comunidades ou sendo admin
CREATE POLICY "Users can delete communities" ON comunidades
FOR DELETE USING (
  criador_id = auth.uid() OR
  id IN (
    SELECT comunidade_id FROM membros_comunidade 
    WHERE usuario_id = auth.uid() AND papel = 'admin' AND status = 'ativo'
  )
);
```

### Políticas para `membros_comunidade`
```sql
-- Habilitar RLS
ALTER TABLE membros_comunidade ENABLE ROW LEVEL SECURITY;

-- Ver membros de comunidades públicas ou onde participa
CREATE POLICY "Users can view community members" ON membros_comunidade
FOR SELECT USING (
  comunidade_id IN (
    SELECT id FROM comunidades WHERE tipo = 'publica'
  ) OR
  comunidade_id IN (
    SELECT comunidade_id FROM membros_comunidade 
    WHERE usuario_id = auth.uid() AND status = 'ativo'
  )
);

-- Participar de comunidades (inserir próprio registro)
CREATE POLICY "Users can join communities" ON membros_comunidade
FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Atualizar próprio status ou sendo admin/moderador
CREATE POLICY "Users can update membership" ON membros_comunidade
FOR UPDATE USING (
  usuario_id = auth.uid() OR
  comunidade_id IN (
    SELECT comunidade_id FROM membros_comunidade 
    WHERE usuario_id = auth.uid() 
    AND papel IN ('admin', 'moderador') 
    AND status = 'ativo'
  )
);

-- Sair de comunidades (deletar próprio registro) ou sendo admin
CREATE POLICY "Users can leave communities" ON membros_comunidade
FOR DELETE USING (
  usuario_id = auth.uid() OR
  comunidade_id IN (
    SELECT comunidade_id FROM membros_comunidade 
    WHERE usuario_id = auth.uid() 
    AND papel = 'admin' 
    AND status = 'ativo'
  )
);
```

## 🔄 Triggers para Contadores

### Trigger para `membros_count`
```sql
-- Função para atualizar contador de membros
CREATE OR REPLACE FUNCTION update_membros_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE comunidades 
    SET membros_count = membros_count + 1 
    WHERE id = NEW.comunidade_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE comunidades 
    SET membros_count = membros_count - 1 
    WHERE id = OLD.comunidade_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para INSERT e DELETE
CREATE TRIGGER trigger_update_membros_count
  AFTER INSERT OR DELETE ON membros_comunidade
  FOR EACH ROW EXECUTE FUNCTION update_membros_count();
```

### Trigger para `eventos_count`
```sql
-- Função para atualizar contador de eventos
CREATE OR REPLACE FUNCTION update_eventos_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.comunidade_id IS NOT NULL THEN
    UPDATE comunidades 
    SET eventos_count = eventos_count + 1 
    WHERE id = NEW.comunidade_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' AND OLD.comunidade_id IS NOT NULL THEN
    UPDATE comunidades 
    SET eventos_count = eventos_count - 1 
    WHERE id = OLD.comunidade_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Se mudou de comunidade
    IF OLD.comunidade_id IS DISTINCT FROM NEW.comunidade_id THEN
      IF OLD.comunidade_id IS NOT NULL THEN
        UPDATE comunidades 
        SET eventos_count = eventos_count - 1 
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
$$ LANGUAGE plpgsql;

-- Trigger para INSERT, UPDATE e DELETE na tabela eventos
CREATE TRIGGER trigger_update_eventos_count
  AFTER INSERT OR UPDATE OR DELETE ON eventos
  FOR EACH ROW EXECUTE FUNCTION update_eventos_count();
```

## 🎯 Dados de Exemplo

### Categorias Sugeridas
```sql
-- Inserir algumas comunidades de exemplo (opcional)
INSERT INTO comunidades (nome, descricao, categoria, tipo, criador_id) VALUES
('Desenvolvedores React', 'Comunidade para desenvolvedores React e Next.js', 'Tecnologia', 'publica', 'uuid-do-usuario'),
('Fotógrafos de Natureza', 'Compartilhe suas melhores fotos da natureza', 'Arte', 'publica', 'uuid-do-usuario'),
('Corredores de São Paulo', 'Grupo de corrida da cidade de São Paulo', 'Esportes', 'publica', 'uuid-do-usuario'),
('Chefs Amadores', 'Receitas e dicas culinárias para iniciantes', 'Culinária', 'publica', 'uuid-do-usuario'),
('Leitores de Ficção', 'Discussões sobre livros de ficção científica e fantasia', 'Literatura', 'privada', 'uuid-do-usuario');
```

## ✅ Checklist de Implementação

### Estrutura de Dados
- [ ] Criar tabela `comunidades`
- [ ] Criar tabela `membros_comunidade`
- [ ] Adicionar `comunidade_id` em `eventos`
- [ ] Criar índices de performance
- [ ] Configurar políticas RLS
- [ ] Implementar triggers de contadores

### Testes
- [ ] Testar criação de comunidade
- [ ] Testar participação em comunidade
- [ ] Testar permissões de moderação
- [ ] Testar contadores automáticos
- [ ] Testar políticas RLS
- [ ] Testar performance com muitos dados

### Validações
- [ ] Nomes de comunidade únicos (opcional)
- [ ] Limites de membros por comunidade
- [ ] Validação de tipos e papéis
- [ ] Prevenção de auto-promoção a admin

**Execute estes comandos SQL no Supabase para preparar o banco de dados! 🗄️**