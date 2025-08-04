---
inclusion: always
---

# Padrões Supabase

## Configuração e Cliente
- Use o cliente configurado em `lib/supabase.ts`
- Sempre verifique autenticação antes de operações sensíveis
- Implemente retry logic com `utils/supabaseRetry.ts`
- Use variáveis de ambiente para configurações

## Autenticação
- Use `useAuth` hook para operações de auth
- Implemente magic links para cadastro sem senha
- Gerencie sessões com `onAuthStateChange`
- Trate erros de autenticação adequadamente

## Queries e Mutations
- Use TypeScript para tipagem das tabelas
- Implemente error handling em todas as queries
- Use `select()` específico ao invés de `select('*')`
- Aplique filtros e ordenação no servidor quando possível

## Real-time e Subscriptions
- Use `subscribe()` para dados em tempo real
- Implemente cleanup de subscriptions
- Gerencie estado local com dados real-time
- Trate reconexões automáticas

## RLS (Row Level Security)
- Sempre configure políticas RLS adequadas
- Teste políticas com diferentes usuários
- Use `auth.uid()` nas políticas quando apropriado
- Documente políticas complexas

## Performance
- Use `cache` para dados que não mudam frequentemente
- Implemente paginação com `range()`
- Use índices apropriados nas tabelas
- Monitore performance das queries

## Tratamento de Erros
- Sempre capture e trate erros do Supabase
- Forneça feedback adequado ao usuário
- Log erros para debugging
- Implemente fallbacks quando possível