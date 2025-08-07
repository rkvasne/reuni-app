/**
 * Teste de Debug RLS
 * Para diagnosticar problemas com os testes RLS
 */

const { createClient } = require('@supabase/supabase-js');

// Configuração
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sihrwhrnswbodpxkrinz.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpaHJ3aHJuc3dib2RweGtyaW56Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzExNzM0NCwiZXhwIjoyMDY4NjkzMzQ0fQ.7BgWSVTv42NVmYtsLDPHQmtzgJAivCSDD8JLEVAj45E';

describe('RLS Debug - Diagnóstico de Problemas', () => {
  let supabaseAdmin;

  beforeAll(() => {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  });

  test('deve conectar ao Supabase', async () => {
    expect(supabaseAdmin).toBeDefined();
    console.log('✅ Cliente Supabase criado com sucesso');
  });

  test('deve conseguir criar usuário de teste', async () => {
    const testEmail = `debug-${Date.now()}@test.com`;
    
    const { data: user, error } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: 'password123',
      email_confirm: true
    });

    console.log('Resultado criação de usuário:', { user: !!user?.user, error: error?.message });

    if (error) {
      console.error('❌ Erro ao criar usuário:', error);
    } else {
      console.log('✅ Usuário criado:', user.user.id);
      
      // Limpar usuário de teste
      await supabaseAdmin.auth.admin.deleteUser(user.user.id);
    }

    expect(error).toBeNull();
    expect(user?.user).toBeDefined();
  });

  test('deve conseguir listar tabelas principais', async () => {
    const tables = ['usuarios', 'eventos', 'comunidades', 'presencas'];
    
    for (const table of tables) {
      const { data, error } = await supabaseAdmin
        .from(table)
        .select('*')
        .limit(1);
        
      console.log(`Tabela ${table}:`, { 
        exists: !error, 
        error: error?.message,
        hasData: data?.length > 0
      });
      
      expect(error).toBeNull();
    }
  });

  test('deve conseguir criar dados de teste simples', async () => {
    // Criar usuário primeiro
    const testEmail = `debug-create-${Date.now()}@test.com`;
    const { data: userResult, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: 'password123',
      email_confirm: true
    });

    expect(userError).toBeNull();
    const userId = userResult.user.id;

    // Inserir usuário na tabela usuarios (necessário para foreign key)
    const { error: insertUserError } = await supabaseAdmin
      .from('usuarios')
      .insert({
        id: userId,
        email: testEmail,
        nome: 'Test User'
      });

    if (insertUserError) {
      console.log('❌ Erro ao inserir na tabela usuarios:', insertUserError.message);
    } else {
      console.log('✅ Usuário inserido na tabela usuarios');
    }

    try {
      // Tentar criar evento
      const { data: event, error: eventError } = await supabaseAdmin
        .from('eventos')
        .insert({
          titulo: 'Evento Debug Test',
          local: 'Local de teste',
          data: new Date().toISOString().split('T')[0], // Formato DATE
          hora: '14:00:00', // Formato TIME
          cidade: 'Cidade de teste',
          organizador_id: userId,
          categoria: 'teste'
        })
        .select()
        .single();

      console.log('Criação de evento:', { 
        success: !!event, 
        error: eventError?.message,
        eventId: event?.id 
      });

      expect(eventError).toBeNull();
      expect(event).toBeDefined();

      // Tentar criar comunidade
      const { data: community, error: communityError } = await supabaseAdmin
        .from('comunidades')
        .insert({
          nome: 'Comunidade Debug Test',
          descricao: 'Teste de debug RLS',
          tipo: 'publica', // Campo obrigatório: 'publica', 'privada', 'restrita'
          categoria: 'tecnologia',
          criador_id: userId,
          privada: false
        })
        .select()
        .single();

      console.log('Criação de comunidade:', { 
        success: !!community, 
        error: communityError?.message,
        communityId: community?.id 
      });

      expect(communityError).toBeNull();
      expect(community).toBeDefined();

    } finally {
      // Cleanup
      await supabaseAdmin.auth.admin.deleteUser(userId);
    }
  });
});