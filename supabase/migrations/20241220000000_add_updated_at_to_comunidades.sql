-- Adicionar coluna updated_at à tabela comunidades
ALTER TABLE comunidades 
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger na tabela comunidades
CREATE TRIGGER update_comunidades_updated_at 
    BEFORE UPDATE ON comunidades 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 