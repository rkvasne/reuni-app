# Product Requirements Document (PRD)
## Reuni - Rede Social de Eventos

**Data:** 21 de Julho de 2025  
**Versão:** 1.0  
**Autor:** Raphael Kvasne - CEO & Fundador da Evoinfo  

---

## 📋 Resumo Executivo

### Visão do Produto
Reuni é uma rede social moderna focada em eventos reais, onde usuários podem descobrir, criar e participar de eventos diversos como shows, meetups, corridas, cursos e encontros. A plataforma combina elementos sociais nostálgicos com tecnologia moderna para criar conexões autênticas através de experiências compartilhadas.

### Problema
- **Fragmentação**: Eventos estão espalhados em múltiplas plataformas (Facebook, Meetup, Eventbrite)
- **Falta de Conexão**: Plataformas atuais focam na transação, não na conexão social
- **Descoberta Limitada**: Difícil encontrar eventos relevantes baseados em interesses e localização
- **Experiência Impessoal**: Falta de elementos sociais que criem senso de comunidade

### Solução
Uma plataforma unificada que:
- Centraliza descoberta e participação em eventos
- Foca na construção de comunidades em torno de interesses
- Oferece experiência social rica com elementos nostálgicos
- Facilita conexões antes, durante e após os eventos

### Métricas de Sucesso
- **Usuários Ativos Mensais**: 10K em 6 meses, 50K em 12 meses
- **Eventos Criados**: 1K eventos/mês após 6 meses
- **Taxa de Participação**: 60% dos usuários confirmam presença em pelo menos 1 evento/mês
- **Retenção**: 40% dos usuários retornam após 30 dias
- **NPS**: Score acima de 50

---

## 🎯 Objetivos do Produto

### Objetivos Primários
1. **Centralizar Descoberta de Eventos**: Ser o destino principal para encontrar eventos locais
2. **Facilitar Conexões Sociais**: Conectar pessoas através de interesses compartilhados
3. **Simplificar Organização**: Tornar fácil criar e promover eventos
4. **Construir Comunidades**: Fomentar grupos duradouros em torno de temas

### Objetivos Secundários
1. **Monetização Sustentável**: Gerar receita através de eventos premium e parcerias
2. **Expansão Geográfica**: Crescer além do mercado inicial (São Paulo)
3. **Diversificação de Eventos**: Abranger todos os tipos de eventos sociais
4. **Integração com Ecossistema**: Conectar com outras plataformas e serviços

---

## 👥 Personas e Mercado

### Persona Primária: "Ana, a Exploradora Social"
- **Demografia**: 25-35 anos, universitária, renda média-alta
- **Comportamento**: Ativa em redes sociais, busca experiências novas
- **Necessidades**: Descobrir eventos interessantes, conhecer pessoas similares
- **Frustrações**: Eventos espalhados em várias plataformas, falta de contexto social

### Persona Secundária: "Carlos, o Organizador Engajado"
- **Demografia**: 30-45 anos, profissional liberal, empreendedor
- **Comportamento**: Organiza meetups, workshops, eventos corporativos
- **Necessidades**: Ferramenta simples para criar e promover eventos
- **Frustrações**: Plataformas complexas, dificuldade em alcançar público certo

### Persona Terciária: "Maria, a Líder Comunitária"
- **Demografia**: 28-40 anos, ativa em causas sociais
- **Comportamento**: Lidera grupos, organiza atividades regulares
- **Necessidades**: Espaço para construir e gerenciar comunidades
- **Frustrações**: Falta de ferramentas adequadas para gestão de grupos

### Tamanho do Mercado
- **TAM (Total Addressable Market)**: R$ 2.5 bilhões (mercado de eventos no Brasil)
- **SAM (Serviceable Addressable Market)**: R$ 500 milhões (eventos sociais urbanos)
- **SOM (Serviceable Obtainable Market)**: R$ 50 milhões (5% do SAM em 5 anos)

---

## ⭐ Funcionalidades Principais

### MVP (Minimum Viable Product)
1. **Autenticação e Perfis**
   - Cadastro/login com email e Google
   - Perfil básico com foto e bio
   - Configurações de privacidade

2. **Descoberta de Eventos**
   - Feed principal com eventos próximos
   - Filtros por data, categoria, localização
   - Busca por texto

3. **Criação de Eventos**
   - Formulário simples de criação
   - Upload de imagem de capa
   - Informações básicas (título, data, local, descrição)

4. **Participação**
   - Botão "Eu Vou" para confirmar presença
   - Lista de participantes
   - Comentários em eventos

### Funcionalidades Futuras (Roadmap)
1. **Comunidades** (3-6 meses)
   - Criação e gestão de grupos
   - Eventos exclusivos para membros
   - Discussões e murais

2. **Social Avançado** (6-9 meses)
   - Sistema de amizades
   - Chat entre participantes
   - Recomendações personalizadas

3. **Monetização** (9-12 meses)
   - Eventos pagos com integração de pagamento
   - Promoção de eventos
   - Parcerias com organizadores

---

## 🚀 Roadmap de Lançamento

### Fase 1: MVP (0-3 meses)
- ✅ Autenticação e perfis básicos
- ✅ Interface principal (landing + app)
- ✅ Layout responsivo de 3 colunas
- 🔄 Sistema de eventos (criação, listagem, participação)
- 🔄 Busca e filtros básicos

### Fase 2: Social (3-6 meses)
- 📋 Sistema de comunidades
- 📋 Comentários e interações
- 📋 Notificações em tempo real
- 📋 Perfis avançados
- 📋 Sistema de seguir/amizades

### Fase 3: Crescimento (6-9 meses)
- 📋 Recomendações personalizadas
- 📋 Chat entre usuários
- 📋 Integração com calendários
- 📋 API pública
- 📋 Programa de embaixadores

### Fase 4: Apps Nativos & Monetização (9-12 meses)
- 📋 Apps Android e iOS (React Native)
- 📋 Eventos pagos
- 📋 Promoção de eventos
- 📋 Parcerias com organizadores
- 📋 Analytics para organizadores
- 📋 Planos premium

**Legenda**: ✅ Concluído | 🔄 Em desenvolvimento | 📋 Planejado

---

## 🏗️ Arquitetura e Tecnologia

### Stack Tecnológico
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Real-time)
- **Deployment**: Vercel
- **Monitoramento**: Vercel Analytics, Sentry

### Estratégia de Plataforma

#### Fase 1: Web App Responsiva (0-6 meses)
- **Aplicação Web**: PWA (Progressive Web App) com experiência mobile-first
- **Responsividade**: Layout adaptável para desktop, tablet e mobile
- **Offline Support**: Service workers para funcionalidade offline básica
- **Install Prompt**: Possibilidade de "instalar" como app no dispositivo
- **Web Push**: Notificações push via navegador

#### Fase 2: Apps Nativos (6-12 meses)
- **React Native**: Desenvolvimento de apps Android e iOS
- **Código Compartilhado**: Máximo reaproveitamento da lógica de negócio
- **Features Nativas**: Câmera, geolocalização, notificações push nativas
- **App Stores**: Distribuição via Google Play e Apple App Store
- **Sincronização**: Dados sincronizados entre web e mobile

### Integrações Planejadas

#### Web App (Fase 1)
- **Google Maps**: Localização e mapas
- **Google Calendar**: Sincronização de eventos
- **Redes Sociais**: Compartilhamento (Instagram, WhatsApp)
- **Web Push**: Notificações via navegador

#### Apps Nativos (Fase 2)
- **Câmera Nativa**: Upload de fotos direto da câmera
- **Geolocalização**: GPS para eventos próximos
- **Push Notifications**: Notificações nativas iOS/Android
- **Calendário Nativo**: Integração com calendário do dispositivo
- **Pagamentos**: Stripe + Apple Pay/Google Pay (futuro)

### Princípios Técnicos
1. **Mobile-First**: Design e desenvolvimento priorizando dispositivos móveis
2. **Performance**: Carregamento rápido e interações fluidas
3. **Acessibilidade**: Conformidade com WCAG 2.1
4. **Escalabilidade**: Arquitetura preparada para crescimento multiplataforma
5. **Offline-First**: Funcionalidade básica mesmo sem conexão

---

## 💰 Modelo de Negócio

### Estratégia de Monetização
1. **Freemium** (Ano 1)
   - Plataforma gratuita para usuários básicos
   - Recursos premium para organizadores (R$ 29/mês)

2. **Marketplace** (Ano 2)
   - Comissão em eventos pagos (5-10%)
   - Taxa de processamento de pagamentos

3. **Publicidade** (Ano 3)
   - Promoção de eventos
   - Patrocínios de comunidades
   - Anúncios nativos

### Projeção Financeira (3 anos)
- **Ano 1**: R$ 50K (foco em crescimento)
- **Ano 2**: R$ 500K (início da monetização)
- **Ano 3**: R$ 2M (diversificação de receitas)

---

## 📊 Métricas e KPIs

### Métricas de Produto
1. **Engajamento**
   - DAU/MAU ratio: >20%
   - Tempo médio na plataforma: >10 min/sessão
   - Eventos visualizados por usuário: >5/sessão

2. **Conversão**
   - Taxa de confirmação de presença: >15%
   - Taxa de criação de eventos: >5% dos usuários
   - Taxa de participação efetiva: >70% dos confirmados

3. **Retenção**
   - Retenção D1: >60%
   - Retenção D7: >30%
   - Retenção D30: >15%

### Métricas de Negócio
1. **Crescimento**
   - Crescimento mensal de usuários: >20%
   - Crescimento de eventos criados: >25%
   - Viral coefficient: >0.5

2. **Qualidade**
   - NPS Score: >50
   - App Store Rating: >4.5
   - Tempo de resposta: <2s

---

## 📝 Próximos Passos

### Imediatos (próximas 2 semanas)
1. Finalizar MVP com sistema de eventos completo
2. Configurar ambiente de produção no Vercel
3. Implementar analytics e monitoramento
4. Criar programa de beta testers

### Curto Prazo (próximo mês)
1. Lançar versão beta para grupo restrito
2. Coletar feedback e iterar rapidamente
3. Implementar melhorias críticas
4. Preparar estratégia de lançamento público

### Médio Prazo (próximos 3 meses)
1. Lançamento público oficial
2. Campanha de marketing e crescimento
3. Implementar funcionalidades sociais avançadas
4. Estabelecer parcerias estratégicas

---

**Este PRD é um documento vivo e será atualizado conforme o produto evolui e novas informações são coletadas do mercado e usuários.**