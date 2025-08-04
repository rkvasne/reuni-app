---
inclusion: always
---

# Padrões Next.js e React

## Estrutura de Arquivos
- Use App Router (pasta `app/`) ao invés do Pages Router
- Componentes em `components/` com PascalCase
- Hooks customizados em `hooks/` com prefixo `use`
- Utilitários em `utils/` e `lib/`
- Tipos TypeScript inline ou em arquivos `.types.ts`

## Convenções de Componentes
- Sempre use `'use client'` para componentes que usam hooks do React
- Prefira componentes funcionais com hooks
- Use TypeScript com interfaces bem definidas
- Exporte como default quando for o componente principal do arquivo

## Padrões de Estado
- Use `useState` para estado local simples
- Use `useEffect` com dependências corretas
- Implemente cleanup em useEffect quando necessário
- Prefira custom hooks para lógica reutilizável

## Roteamento
- Use `useRouter` do `next/navigation` (App Router)
- Implemente loading states com `loading.tsx`
- Use `not-found.tsx` para páginas 404
- Prefira Server Components quando possível

## Performance
- Use `React.memo` apenas quando necessário
- Implemente lazy loading com `dynamic` do Next.js
- Otimize imagens com `next/image`
- Use `useCallback` e `useMemo` com parcimônia