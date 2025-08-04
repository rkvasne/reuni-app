---
inclusion: always
---

# Padrões de Testes

## Estrutura de Testes
- Coloque testes próximos aos arquivos testados ou em pasta `__tests__`
- Use extensão `.test.ts` ou `.test.tsx`
- Organize testes em `describe` blocks lógicos
- Use nomes descritivos para casos de teste

## Jest e Testing Library
- Use `@testing-library/react` para testes de componentes
- Prefira queries por role, label ou text
- Use `userEvent` para interações do usuário
- Implemente `waitFor` para operações assíncronas

## Mocking
- Mock APIs externas e serviços
- Use `jest.mock()` para módulos inteiros
- Implemente mocks específicos para Supabase
- Limpe mocks entre testes com `beforeEach`

## Testes de Componentes
- Teste comportamento, não implementação
- Verifique renderização condicional
- Teste interações do usuário
- Valide props e callbacks

## Testes de Hooks
- Use `renderHook` do testing library
- Teste estados iniciais e transições
- Verifique side effects
- Teste cleanup e unmounting

## Cobertura e Qualidade
- Mantenha cobertura acima de 80%
- Foque em caminhos críticos
- Teste casos de erro
- Use snapshots com parcimônia

## Comandos Úteis
- `npm test` - Executar todos os testes
- `npm test -- --watch` - Modo watch
- `npm test -- --coverage` - Relatório de cobertura
- `npm test -- --run` - Executar uma vez (para CI)