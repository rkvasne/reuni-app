---
inclusion: manual
---

# Hooks de Desenvolvimento Recomendados

## Hooks Úteis para o Projeto

### 1. **Auto-Test Runner**
- **Trigger**: Ao salvar arquivos `.ts` ou `.tsx`
- **Ação**: Executar testes relacionados automaticamente
- **Benefício**: Feedback imediato sobre quebras

### 2. **Component Documentation**
- **Trigger**: Ao criar novos componentes
- **Ação**: Gerar documentação básica e exemplos de uso
- **Benefício**: Manter documentação sempre atualizada

### 3. **Type Safety Check**
- **Trigger**: Ao modificar interfaces ou tipos
- **Ação**: Verificar impactos em outros arquivos
- **Benefício**: Prevenir erros de tipagem

### 4. **Supabase Schema Sync**
- **Trigger**: Ao modificar migrações SQL
- **Ação**: Atualizar tipos TypeScript automaticamente
- **Benefício**: Manter tipos sincronizados com banco

### 5. **Performance Audit**
- **Trigger**: Manual ou ao fazer build
- **Ação**: Analisar bundle size e performance
- **Benefício**: Identificar gargalos rapidamente

## Como Configurar
1. Abra Command Palette (Ctrl/Cmd + Shift + P)
2. Digite "Open Kiro Hook UI"
3. Configure os hooks desejados
4. Teste com arquivos do projeto