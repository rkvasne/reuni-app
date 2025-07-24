-- 📁 CONFIGURAÇÃO FINAL - Storage para Upload
-- Execute APENAS se quiser upload de imagens

-- Criar bucket para eventos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'events',
  'events',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Políticas básicas
DROP POLICY IF EXISTS "Public read events" ON storage.objects;
CREATE POLICY "Public read events" ON storage.objects FOR SELECT USING (bucket_id = 'events');

DROP POLICY IF EXISTS "Auth upload events" ON storage.objects;
CREATE POLICY "Auth upload events" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'events' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users delete own events" ON storage.objects;
CREATE POLICY "Users delete own events" ON storage.objects FOR DELETE USING (bucket_id = 'events' AND auth.uid()::text = (storage.foldername(name))[1]);