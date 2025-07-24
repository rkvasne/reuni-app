# 📱 Plano de Melhorias Sociais - Layout e UX

## 🎯 **Objetivo**
Integrar funcionalidades sociais avançadas no layout atual sem poluir a interface, criando uma experiência mais rica e personalizada.

## 📐 **Layout Atual (Análise)**

### **Sidebar Esquerda** ✅ (Mantida)
- Navegação principal (Início, Buscar, Meus Eventos, Perfil)
- Comunidades com contador
- Eventos Próximos, Salvos
- Botão "+ Criar Evento"

### **Feed Central** 🔄 (Melhorias planejadas)
- Banner rotativo com destaques
- Filtros por data/categoria
- Cards de eventos
- **NOVO**: Sliders horizontais com eventos sociais

### **Sidebar Direita** 🔄 (Expansão planejada)
- **NOVO**: Amigos indo hoje
- **NOVO**: Eventos de amigos
- **NOVO**: Comunidades em alta
- **NOVO**: Ações rápidas
- **NOVO**: Mini calendário (modal/dropdown)

---

## 🗓️ **Implementação Faseada**

### **Fase 1: Estrutura Base** (Semana 1)
**Objetivo**: Preparar componentes base sem alterar layout atual

#### **1.1 Componentes de Slider/Carrossel**
- [ ] `HorizontalSlider.tsx` - Componente base reutilizável
- [ ] `EventSlider.tsx` - Slider específico para eventos
- [ ] `CommunitySlider.tsx` - Slider para comunidades

#### **1.2 Hooks Sociais**
- [ ] `useFriendsEvents.ts` - Eventos de amigos
- [ ] `useSuggestedEvents.ts` - Eventos sugeridos
- [ ] `useTrendingCommunities.ts` - Comunidades em alta

#### **1.3 Componentes de Card Melhorados**
- [ ] `SocialEventCard.tsx` - Card com info social (quem vai)
- [ ] `CompactEventCard.tsx` - Versão compacta para sliders
- [ ] `CommunityHighlightCard.tsx` - Card para comunidades em alta

---

### **Fase 2: Feed Central Melhorado** (Semana 2)
**Objetivo**: Adicionar sliders horizontais no feed principal

#### **2.1 Seções do Feed**
- [ ] **Banner de Destaques** (já existe - melhorar)
- [ ] **Filtros Avançados** (expandir os atuais)
- [ ] **Eventos Principais** (feed atual)
- [ ] **NOVO**: "Eventos de Amigos" (slider horizontal)
- [ ] **NOVO**: "Sugeridos para Você" (slider horizontal)
- [ ] **NOVO**: "Eventos Populares" (slider horizontal)

#### **2.2 Layout do Feed**
```tsx
<MainFeed>
  <BannerCarousel />
  <FilterBar />
  
  {/* Seção principal */}
  <EventGrid events={mainEvents} />
  
  {/* Sliders sociais */}
  <SocialSection title="Eventos de Amigos">
    <EventSlider events={friendsEvents} />
  </SocialSection>
  
  <SocialSection title="Sugeridos para Você">
    <EventSlider events={suggestedEvents} />
  </SocialSection>
  
  <SocialSection title="Populares Agora">
    <EventSlider events={trendingEvents} />
  </SocialSection>
</MainFeed>
```

---

### **Fase 3: Sidebar Direita Expandida** (Semana 3)
**Objetivo**: Adicionar blocos sociais na sidebar direita

#### **3.1 Componentes da Sidebar**
- [ ] `FriendsGoingToday.tsx` - Amigos indo hoje
- [ ] `FriendsEventsBlock.tsx` - Eventos que amigos vão
- [ ] `TrendingCommunitiesBlock.tsx` - Comunidades em alta
- [ ] `QuickActionsBlock.tsx` - Ações rápidas

#### **3.2 Layout da Sidebar Direita**
```tsx
<RightSidebar>
  {/* Máximo 3 blocos visíveis */}
  <SidebarBlock title="Amigos Indo Hoje" collapsible>
    <FriendsGoingToday />
  </SidebarBlock>
  
  <SidebarBlock title="Eventos de Amigos" collapsible>
    <FriendsEventsBlock />
  </SidebarBlock>
  
  <SidebarBlock title="Comunidades em Alta" collapsible>
    <TrendingCommunitiesBlock />
  </SidebarBlock>
  
  {/* Ações rápidas sempre visíveis */}
  <QuickActionsBlock />
</RightSidebar>
```

---

### **Fase 4: Mini Calendário** (Semana 4)
**Objetivo**: Adicionar calendário interativo

#### **4.1 Componente de Calendário**
- [ ] `MiniCalendar.tsx` - Calendário compacto
- [ ] `CalendarModal.tsx` - Modal expandido
- [ ] `CalendarDropdown.tsx` - Dropdown lateral

#### **4.2 Funcionalidades**
- [ ] Mostrar dias com eventos confirmados
- [ ] Filtrar feed ao clicar no dia
- [ ] Navegação entre meses
- [ ] Indicadores visuais (dots coloridos)

---

### **Fase 5: Responsividade e Polimento** (Semana 5)
**Objetivo**: Garantir experiência perfeita em todos os dispositivos

#### **5.1 Responsividade**
- [ ] **Desktop**: Layout de 3 colunas completo
- [ ] **Tablet**: Sidebar direita colapsável
- [ ] **Mobile**: Navegação por abas/bottom sheet

#### **5.2 Animações e Transições**
- [ ] Hover effects suaves
- [ ] Transições entre seções
- [ ] Loading states elegantes
- [ ] Micro-interações

---

## 🎨 **Especificações de Design**

### **Hierarquia Visual**
1. **Banner de Destaques** - Mais proeminente
2. **Feed Principal** - Foco central
3. **Sliders Sociais** - Secundário mas visível
4. **Sidebar Direita** - Informação de apoio

### **Cores e Espaçamento**
- **Sliders**: Background sutil (neutral-50)
- **Cards**: Sombra suave, bordas arredondadas
- **Sidebar**: Blocos com separação clara
- **Espaçamento**: 16px entre seções, 8px entre cards

### **Ícones e Feedback**
- **Ícones**: Lucide React (consistência)
- **Hover**: Escala 1.02, sombra aumentada
- **Loading**: Skeleton screens
- **Estados vazios**: Ilustrações simples

---

## 📊 **Métricas de Sucesso**

### **Engajamento**
- [ ] Aumento de cliques em eventos sugeridos
- [ ] Tempo gasto na página principal
- [ ] Interações com sliders sociais

### **Performance**
- [ ] Tempo de carregamento < 2s
- [ ] Smooth scrolling em sliders
- [ ] Responsividade em todos os dispositivos

### **UX**
- [ ] Facilidade de navegação
- [ ] Descoberta de novos eventos
- [ ] Conexões sociais aumentadas

---

## 🔧 **Implementação Técnica**

### **Componentes Reutilizáveis**
```tsx
// Base para todos os sliders
<HorizontalSlider>
  <EventCard />
  <EventCard />
  <EventCard />
</HorizontalSlider>

// Seção social padrão
<SocialSection 
  title="Título" 
  viewAllLink="/link"
  loading={false}
>
  <Content />
</SocialSection>

// Bloco da sidebar
<SidebarBlock 
  title="Título"
  collapsible={true}
  defaultOpen={true}
>
  <Content />
</SidebarBlock>
```

### **Hooks Personalizados**
```tsx
// Dados sociais
const { friendsEvents, loading } = useFriendsEvents()
const { suggestedEvents } = useSuggestedEvents()
const { trendingCommunities } = useTrendingCommunities()

// Estado do calendário
const { selectedDate, eventsForDate } = useCalendar()
```

---

## 🚀 **Próximo Passo**

**Começar com Fase 1**: Criar componentes base sem alterar o layout atual.

Quer que eu comece implementando algum componente específico da Fase 1?