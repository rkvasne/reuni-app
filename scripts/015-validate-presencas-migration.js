/**
 * Script para validar a migração da tabela presencas
 * Verifica se a sintaxe SQL está correta e se todas as operações são válidas
 */

const fs = require('fs');
const path = require('path');

function validateMigration() {
    console.log('🔍 Validando migração da tabela presencas...\n');
    
    const migrationPath = path.join(__dirname, '../supabase/migrations/017_fix_presencas_table.sql');
    
    if (!fs.existsSync(migrationPath)) {
        console.error('❌ Arquivo de migração não encontrado:', migrationPath);
        return false;
    }
    
    const migrationContent = fs.readFileSync(migrationPath, 'utf8');
    
    // Verificações básicas de sintaxe e estrutura
    const checks = [
        {
            name: 'Adicionar campo updated_at',
            pattern: /ALTER TABLE presencas\s+ADD COLUMN IF NOT EXISTS updated_at/i,
            required: true
        },
        {
            name: 'Adicionar campo data_confirmacao',
            pattern: /ALTER TABLE presencas\s+ADD COLUMN IF NOT EXISTS data_confirmacao/i,
            required: true
        },
        {
            name: 'Foreign key para eventos',
            pattern: /presencas_evento_id_fkey/i,
            required: true
        },
        {
            name: 'Foreign key para usuarios',
            pattern: /presencas_usuario_id_fkey/i,
            required: true
        },
        {
            name: 'Constraint de unicidade',
            pattern: /presencas_evento_id_usuario_id_key/i,
            required: true
        },
        {
            name: 'Política RLS para SELECT',
            pattern: /"presencas_select_all"/i,
            required: true
        },
        {
            name: 'Política RLS para INSERT',
            pattern: /"presencas_insert_own"/i,
            required: true
        },
        {
            name: 'Política RLS para UPDATE',
            pattern: /"presencas_update_own"/i,
            required: true
        },
        {
            name: 'Política RLS para DELETE',
            pattern: /"presencas_delete_own"/i,
            required: true
        },
        {
            name: 'Índice para evento_id',
            pattern: /CREATE INDEX.*idx_presencas_evento.*ON presencas\(evento_id\)/i,
            required: true
        },
        {
            name: 'Índice para usuario_id',
            pattern: /CREATE INDEX.*idx_presencas_usuario.*ON presencas\(usuario_id\)/i,
            required: true
        },
        {
            name: 'Índice para status',
            pattern: /CREATE INDEX.*idx_presencas_status.*ON presencas\(status\)/i,
            required: true
        },
        {
            name: 'Trigger de updated_at',
            pattern: /update_presencas_updated_at/i,
            required: true
        },
        {
            name: 'Função de contador de participantes',
            pattern: /CREATE OR REPLACE FUNCTION update_evento_participantes_count/i,
            required: true
        },
        {
            name: 'Trigger de contador de participantes',
            pattern: /CREATE TRIGGER.*trigger_update_participantes_count/i,
            required: true
        }
    ];
    
    let allPassed = true;
    
    checks.forEach(check => {
        const found = check.pattern.test(migrationContent);
        const status = found ? '✅' : '❌';
        console.log(`${status} ${check.name}`);
        
        if (check.required && !found) {
            allPassed = false;
        }
    });
    
    // Verificar se não há erros de sintaxe óbvios
    const syntaxChecks = [
        {
            name: 'Parênteses balanceados',
            test: () => {
                const open = (migrationContent.match(/\(/g) || []).length;
                const close = (migrationContent.match(/\)/g) || []).length;
                return open === close;
            }
        },
        {
            name: 'Blocos DO balanceados',
            test: () => {
                const doBlocks = (migrationContent.match(/DO\s*\$/gi) || []).length;
                const endBlocks = (migrationContent.match(/END\s*\$/gi) || []).length;
                return doBlocks === endBlocks;
            }
        },
        {
            name: 'Comandos SQL terminados com ponto e vírgula',
            test: () => {
                // Verificar se comandos principais terminam com ;
                const commands = migrationContent.match(/(CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|COMMENT)\s+[^;]*;/gi);
                return commands && commands.length > 0;
            }
        }
    ];
    
    console.log('\n🔧 Verificações de sintaxe:');
    syntaxChecks.forEach(check => {
        const passed = check.test();
        const status = passed ? '✅' : '❌';
        console.log(`${status} ${check.name}`);
        
        if (!passed) {
            allPassed = false;
        }
    });
    
    console.log('\n📊 Resumo da validação:');
    if (allPassed) {
        console.log('✅ Todas as verificações passaram!');
        console.log('🎉 A migração está pronta para ser aplicada.');
        
        // Mostrar estatísticas
        const lines = migrationContent.split('\n').length;
        const policies = (migrationContent.match(/CREATE POLICY/gi) || []).length;
        const indexes = (migrationContent.match(/CREATE INDEX/gi) || []).length;
        const triggers = (migrationContent.match(/CREATE TRIGGER/gi) || []).length;
        
        console.log(`\n📈 Estatísticas da migração:`);
        console.log(`   - Linhas de código: ${lines}`);
        console.log(`   - Políticas RLS: ${policies}`);
        console.log(`   - Índices: ${indexes}`);
        console.log(`   - Triggers: ${triggers}`);
        
    } else {
        console.log('❌ Algumas verificações falharam.');
        console.log('🔧 Revise a migração antes de aplicar.');
    }
    
    return allPassed;
}

// Executar validação
if (require.main === module) {
    const isValid = validateMigration();
    process.exit(isValid ? 0 : 1);
}

module.exports = { validateMigration };