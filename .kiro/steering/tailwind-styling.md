---
inclusion: always
---

# Padrões de Estilo Tailwind CSS

## Paleta de Cores do Projeto
- **Primary**: `primary-500` (#9B59B6) - Roxo principal
- **Secondary**: `secondary-500` (#8E44AD) - Roxo escuro
- **Neutral**: `neutral-50` a `neutral-900` - Escala de cinzas
- **Action**: Cores específicas para ações (blue, green, orange, gray)

## Convenções de Classes
- Use classes utilitárias do Tailwind ao invés de CSS customizado
- Prefira `bg-gradient-primary` para gradientes principais
- Use `shadow-reuni` para sombras consistentes com o tema
- Aplique `rounded-xl` para bordas arredondadas padrão

## Responsividade
- Mobile-first: escreva estilos base para mobile
- Use breakpoints: `sm:`, `md:`, `lg:`, `xl:`
- Teste em diferentes tamanhos de tela
- Use `hidden` e `block` para mostrar/ocultar elementos

## Estados Interativos
- Sempre inclua estados `hover:` e `focus:`
- Use `transition-all` para animações suaves
- Implemente `disabled:` states quando aplicável
- Use `active:` para feedback visual em cliques

## Componentes Reutilizáveis
- Crie classes compostas no `tailwind.config.js` quando necessário
- Use `@apply` no CSS apenas para componentes muito específicos
- Prefira props condicionais para variações de estilo
- Mantenha consistência visual entre componentes similares

## Acessibilidade
- Use `focus:ring-2` para indicadores de foco
- Mantenha contraste adequado entre texto e fundo
- Use `sr-only` para texto apenas para leitores de tela
- Implemente `aria-*` attributes quando necessário