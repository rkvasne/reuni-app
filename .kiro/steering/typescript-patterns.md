---
inclusion: always
---

# Padrões TypeScript

## Tipagem de Componentes
- Use interfaces para props de componentes
- Defina tipos para estados complexos
- Use generics quando apropriado
- Evite `any` - prefira `unknown` quando necessário

```typescript
interface ComponentProps {
  title: string
  isVisible?: boolean
  onAction: (id: string) => void
}
```

## Hooks Customizados
- Sempre tipem o retorno dos hooks
- Use tipos específicos para estados
- Documente parâmetros complexos
- Implemente error types quando aplicável

```typescript
interface UseDataReturn {
  data: DataType[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}
```

## Tipos de API e Dados
- Crie interfaces para respostas da API
- Use union types para estados específicos
- Implemente type guards quando necessário
- Mantenha tipos sincronizados com o backend

## Utilitários de Tipo
- Use `Partial<T>` para objetos opcionais
- Aplique `Pick<T, K>` e `Omit<T, K>` quando apropriado
- Crie tipos utilitários específicos do projeto
- Use `as const` para arrays e objetos imutáveis

## Tratamento de Erros
- Defina tipos específicos para diferentes erros
- Use discriminated unions para estados de erro
- Implemente type-safe error handling
- Documente possíveis erros em funções

## Configuração
- Use `strict: true` no tsconfig.json
- Configure `noImplicitAny` e `noImplicitReturns`
- Use path mapping para imports limpos
- Mantenha configuração consistente entre ambientes