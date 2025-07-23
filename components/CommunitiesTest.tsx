'use client';

import { useEffect, useState } from 'react';
import { useCommunities } from '@/hooks/useCommunities';
import { useAuth } from '@/hooks/useAuth';

export default function CommunitiesTest() {
  const { user } = useAuth();
  const { communities, loading, error, fetchCommunities, createCommunity } = useCommunities();
  const [testResult, setTestResult] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResult(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runTests = async () => {
    setTestResult([]);
    addResult('🧪 Iniciando testes do sistema de comunidades...');

    try {
      // Teste 1: Buscar comunidades
      addResult('📋 Teste 1: Buscando comunidades...');
      await fetchCommunities();
      addResult(`✅ Encontradas ${communities.length} comunidades`);

      // Teste 2: Criar comunidade (se usuário logado)
      if (user) {
        addResult('🏗️ Teste 2: Criando comunidade de teste...');
        try {
          const newCommunity = await createCommunity({
            nome: `Teste ${Date.now()}`,
            descricao: 'Comunidade criada automaticamente para teste',
            categoria: 'Tecnologia',
            tipo: 'publica'
          });
          addResult(`✅ Comunidade criada: ${newCommunity.nome}`);
        } catch (err) {
          addResult(`❌ Erro ao criar comunidade: ${err}`);
        }
      } else {
        addResult('⚠️ Teste 2: Usuário não logado, pulando criação');
      }

      // Teste 3: Buscar com filtros
      addResult('🔍 Teste 3: Testando busca com filtros...');
      await fetchCommunities({ categoria: 'Tecnologia' });
      addResult('✅ Busca com filtros funcionando');

      addResult('🎉 Todos os testes concluídos!');
    } catch (err) {
      addResult(`❌ Erro geral: ${err}`);
    }
  };

  useEffect(() => {
    if (user !== undefined) { // Aguarda carregar auth
      runTests();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="p-6 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">🧪 Testando Sistema de Comunidades</h3>
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          Carregando testes...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">🧪 Teste do Sistema de Comunidades</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700">
          ❌ Erro: {error}
        </div>
      )}

      <div className="space-y-2 mb-4">
        <div className="text-sm">
          <strong>Status:</strong> {user ? `Logado como ${user.email}` : 'Não logado'}
        </div>
        <div className="text-sm">
          <strong>Comunidades encontradas:</strong> {communities.length}
        </div>
      </div>

      <div className="bg-white p-4 rounded border max-h-60 overflow-y-auto">
        <h4 className="font-medium mb-2">📋 Log de Testes:</h4>
        {testResult.length === 0 ? (
          <p className="text-gray-500">Nenhum teste executado ainda...</p>
        ) : (
          <div className="space-y-1 text-sm font-mono">
            {testResult.map((result, index) => (
              <div key={index} className="text-gray-700">
                {result}
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={runTests}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        🔄 Executar Testes Novamente
      </button>

      {communities.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium mb-2">📋 Comunidades Encontradas:</h4>
          <div className="space-y-2">
            {communities.slice(0, 3).map(community => (
              <div key={community.id} className="p-3 bg-white rounded border">
                <div className="font-medium">{community.nome}</div>
                <div className="text-sm text-gray-600">
                  {community.categoria} • {community.membros_count} membros • {community.tipo}
                </div>
                {community.is_member && (
                  <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                    Você é membro ({community.user_role})
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}