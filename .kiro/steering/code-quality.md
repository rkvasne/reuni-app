---
inclusion: always
---

# Padrões de Qualidade de Código

## Formatação e Estilo
- Use ESLint com configuração Next.js
- Mantenha linhas com máximo 100 caracteres
- Use 2 espaços para indentação
- Sempre termine arquivos com nova linha

## Nomenclatura
- **Variáveis e funções**: camelCase descritivo
- **Componentes**: PascalCase
- **Constantes**: UPPER_SNAKE_CASE
- **Arquivos**: kebab-case ou PascalCase para componentes

## Comentários e Documentação
- Comente código complexo ou não óbvio
- Use JSDoc para funções públicas importantes
- Mantenha comentários atualizados
- Evite comentários óbvios

```typescript
/**
 * Calcula a distância entre dois eventos baseado em coordenadas
 * @param event1 - Primeiro evento com lat/lng
 * @param event2 - Segundo evento com lat/lng
 * @returns Distância em quilômetros
 */
function calculateDistance(event1: Event, event2: Event): number {
  // Implementação usando fórmula de Haversine
}
```

## Tratamento de Erros
- Sempre trate erros explicitamente
- Use try/catch para operações assíncronas
- Forneça mensagens de erro úteis ao usuário
- Log erros para debugging

## Performance
- Evite re-renders desnecessários
- Use lazy loading para componentes pesados
- Otimize imagens e assets
- Implemente debounce em inputs de busca

## Segurança
- Valide inputs do usuário
- Sanitize dados antes de exibir
- Use HTTPS em produção
- Implemente rate limiting quando apropriado

## Acessibilidade
- Use semantic HTML
- Implemente navegação por teclado
- Adicione alt text em imagens
- Mantenha contraste adequado

## Git e Versionamento
- Commits pequenos e focados
- Mensagens de commit descritivas em português
- Use branches para features
- Faça code review antes de merge