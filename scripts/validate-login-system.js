#!/usr/bin/env node

/**
 * Script de Validação do Sistema de Login
 * 
 * Executa verificações automáticas para garantir que o sistema de login
 * está funcionando corretamente antes de deployments.
 * 
 * USO: node scripts/validate-login-system.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validando Sistema de Login Reuni...\n');

let errors = 0;
let warnings = 0;

function checkFile(filePath) {
  return fs.existsSync(path.join(process.cwd(), filePath));
}

function readFile(filePath) {
  try {
    return fs.readFileSync(path.join(process.cwd(), filePath), 'utf8');
  } catch (error) {
    return null;
  }
}

function logError(message) {
  console.log(`❌ ERRO: ${message}`);
  errors++;
}

function logWarning(message) {
  console.log(`⚠️  AVISO: ${message}`);
  warnings++;
}

function logSuccess(message) {
  console.log(`✅ ${message}`);
}

// 1. Verificar arquivos críticos existem
console.log('📁 Verificando arquivos críticos...');

const criticalFiles = [
  'hooks/useAuth.ts',
  'hooks/useUserProfile.ts', 
  'hooks/useUserSync.ts',
  'utils/middlewareUtils.ts',
  'utils/authCleanup.ts',
  'app/auth/callback/page.tsx',
  'app/profile/complete/page.tsx',
  'middleware.ts'
];

criticalFiles.forEach(file => {
  if (checkFile(file)) {
    logSuccess(`Arquivo ${file} existe`);
  } else {
    logError(`Arquivo crítico ${file} não encontrado`);
  }
});

// 2. Verificar middleware exceptions
console.log('\n🛡️  Verificando middleware...');

const middlewareUtilsContent = readFile('utils/middlewareUtils.ts');
if (middlewareUtilsContent) {
  if (middlewareUtilsContent.includes('/profile/complete')) {
    logSuccess('Middleware permite /profile/complete');
  } else {
    logError('Middleware NÃO permite /profile/complete - usuários ficarão em loop!');
  }
  
  if (middlewareUtilsContent.includes('exceptions')) {
    logSuccess('Sistema de exceções do middleware implementado');
  } else {
    logWarning('Sistema de exceções pode não estar implementado corretamente');
  }
} else {
  logError('Não foi possível ler utils/middlewareUtils.ts');
}

// 3. Verificar useUserProfile dependencies
console.log('\n🔄 Verificando hooks...');

const useUserProfileContent = readFile('hooks/useUserProfile.ts');
if (useUserProfileContent) {
  // Verificar se não há a condição problemática
  if (useUserProfileContent.includes('!state.isLoading') && 
      useUserProfileContent.includes('authUser && !state.profile && !state.isLoading')) {
    logError('useUserProfile contém condição de loop infinito!');
  } else {
    logSuccess('useUserProfile sem loops infinitos detectados');
  }
  
  // Verificar atomic operations
  if (useUserProfileContent.includes('upsert')) {
    logSuccess('useUserProfile usa operações atômicas');
  } else {
    logWarning('useUserProfile pode não estar usando operações atômicas');
  }
} else {
  logError('Não foi possível ler hooks/useUserProfile.ts');
}

// 4. Verificar useUserSync implementation
const useUserSyncContent = readFile('hooks/useUserSync.ts');
if (useUserSyncContent) {
  if (useUserSyncContent.includes('export') && useUserSyncContent.includes('useUserSync')) {
    logSuccess('useUserSync está exportado corretamente');
  } else {
    logError('useUserSync pode não estar exportado corretamente');
  }
  
  if (useUserSyncContent.includes('onConflict')) {
    logSuccess('useUserSync usa upsert com onConflict');
  } else {
    logWarning('useUserSync pode não estar usando upsert atômico');
  }
} else {
  logError('Não foi possível ler hooks/useUserSync.ts');
}

// 5. Verificar profile completion logic
console.log('\n👤 Verificando lógica de perfil...');

const callbackContent = readFile('app/auth/callback/page.tsx');
if (callbackContent) {
  // Verificar se verifica both nome AND avatar
  if (callbackContent.includes('!profile?.nome || !profile?.avatar') ||
      callbackContent.includes('!profile?.avatar || !profile?.nome')) {
    logSuccess('Callback verifica NOME E AVATAR para perfil completo');
  } else if (callbackContent.includes('!profile?.nome') && callbackContent.includes('!profile?.avatar')) {
    logSuccess('Callback verifica nome e avatar (verificação separada detectada)');
  } else {
    logError('Callback pode não estar verificando nome E avatar!');
  }
} else {
  logError('Não foi possível ler app/auth/callback/page.tsx');
}

// 6. Verificar se debug foi removido
console.log('\n🧹 Verificando limpeza de debug...');

const pageContent = readFile('app/page.tsx');
if (pageContent) {
  if (pageContent.includes('WelcomeDebug')) {
    logWarning('WelcomeDebug ainda presente em app/page.tsx');
  } else {
    logSuccess('Debug de boas-vindas removido');
  }
  
  // Verificar logs de debug ainda presentes
  const debugLogs = (pageContent.match(/console\.log.*Debug|Debug.*console\.log/gi) || []).length;
  if (debugLogs > 0) {
    logWarning(`${debugLogs} logs de debug ainda presentes em app/page.tsx`);
  } else {
    logSuccess('Logs de debug removidos de app/page.tsx');
  }
} else {
  logError('Não foi possível ler app/page.tsx');
}

// 7. Verificar authCleanup
console.log('\n🧹 Verificando limpeza de auth...');

const authCleanupContent = readFile('utils/authCleanup.ts');
if (authCleanupContent) {
  if (authCleanupContent.includes('clearAuthData') && authCleanupContent.includes('export')) {
    logSuccess('authCleanup.ts exporta clearAuthData');
  } else {
    logError('clearAuthData não encontrado em authCleanup.ts');
  }
  
  if (authCleanupContent.includes('development')) {
    logSuccess('Logs de authCleanup condicionais ao ambiente');
  } else {
    logWarning('Logs de authCleanup podem não ser condicionais ao ambiente');
  }
} else {
  logError('Não foi possível ler utils/authCleanup.ts');
}

// 8. Verificar documentação
console.log('\n📚 Verificando documentação...');

if (checkFile('docs/LOGIN_SYSTEM_REFACTORING_REPORT.md')) {
  logSuccess('Relatório de refatoração existe');
} else {
  logWarning('Relatório de refatoração não encontrado');
}

if (checkFile('docs/AI_AGENT_LOGIN_SYSTEM_GUIDE.md')) {
  logSuccess('Guia para agentes de IA existe');
} else {
  logWarning('Guia para agentes de IA não encontrado');
}

if (checkFile('.ai-memory/login-system-context.md')) {
  logSuccess('Contexto de memória para IA existe');
} else {
  logWarning('Contexto de memória para IA não encontrado');
}

// Resultado final
console.log('\n' + '='.repeat(50));
console.log('📊 RESULTADO DA VALIDAÇÃO');
console.log('='.repeat(50));

if (errors === 0 && warnings === 0) {
  console.log('🎉 SISTEMA PERFEITO! Todas as verificações passaram.');
  process.exit(0);
} else if (errors === 0) {
  console.log(`✅ SISTEMA OK! ${warnings} avisos encontrados (não críticos).`);
  console.log('💡 Recomenda-se revisar os avisos antes do deploy.');
  process.exit(0);
} else {
  console.log(`🚨 SISTEMA COM PROBLEMAS! ${errors} erros e ${warnings} avisos encontrados.`);
  console.log('❌ NÃO faça deploy até resolver os erros críticos!');
  console.log('\n📖 Consulte docs/LOGIN_SYSTEM_REFACTORING_REPORT.md para soluções.');
  process.exit(1);
}
