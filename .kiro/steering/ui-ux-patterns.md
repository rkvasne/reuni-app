---
inclusion: fileMatch
fileMatchPattern: "components/**"
---

# Padrões de UI/UX

## Design System
- **Cores**: Use paleta definida no Tailwind config
- **Tipografia**: Font Poppins como principal
- **Espaçamento**: Múltiplos de 4px (1, 2, 3, 4, 6, 8, 12, 16...)
- **Bordas**: `rounded-xl` como padrão (12px)

## Componentes de Interface

### Botões
- **Primário**: Gradiente roxo com hover states
- **Secundário**: Borda com background transparente
- **Tamanhos**: sm, md, lg com padding consistente
- **Estados**: loading, disabled, hover, focus

### Cards
- **Sombra**: `shadow-reuni` para consistência
- **Padding**: `p-6` como padrão
- **Hover**: Leve elevação com `hover:shadow-reuni-lg`
- **Bordas**: `rounded-xl` sempre

### Modais
- **Backdrop**: `bg-black/50` com blur
- **Animações**: Fade in/out suaves
- **Fechamento**: ESC key e click fora
- **Responsividade**: Adaptar para mobile

### Formulários
- **Labels**: Sempre visíveis e descritivos
- **Inputs**: Estados focus, error, disabled
- **Validação**: Feedback visual imediato
- **Acessibilidade**: aria-labels apropriados

## Estados de Loading
- **Skeleton**: Para listas e cards
- **Spinners**: Para ações pontuais
- **Progressos**: Para uploads/downloads
- **Feedback**: Sempre informar o usuário

## Responsividade
- **Mobile First**: Design para mobile primeiro
- **Breakpoints**: sm (640px), md (768px), lg (1024px)
- **Touch Targets**: Mínimo 44px para elementos clicáveis
- **Navegação**: Adaptada para touch e desktop

## Microinterações
- **Hover**: Mudanças sutis de cor/sombra
- **Click**: Feedback visual imediato
- **Transições**: 150ms como padrão
- **Animações**: Suaves e com propósito

## Acessibilidade
- **Contraste**: Mínimo 4.5:1 para texto
- **Foco**: Indicadores visíveis
- **Screen Readers**: Texto alternativo
- **Navegação**: Suporte completo ao teclado