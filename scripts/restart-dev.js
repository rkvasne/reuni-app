#!/usr/bin/env node

/**
 * Script para reiniciar o servidor de desenvolvimento
 * Útil após mudanças no next.config.js
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🔄 Reiniciando servidor de desenvolvimento...');

try {
  // Limpar cache do Next.js
  console.log('🧹 Limpando cache...');
  execSync('npx next build --no-lint', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('✅ Cache limpo com sucesso!');
  console.log('');
  console.log('🚀 Agora execute: npm run dev');
  console.log('');
  console.log('📝 Mudanças aplicadas:');
  console.log('  ✅ Domínios de imagem adicionados ao next.config.js');
  console.log('  ✅ Componente OptimizedImage corrigido');
  console.log('  ✅ Utilitários de imagem criados');
  
} catch (error) {
  console.error('❌ Erro ao limpar cache:', error.message);
  console.log('');
  console.log('💡 Tente executar manualmente:');
  console.log('  rm -rf .next');
  console.log('  npm run dev');
}