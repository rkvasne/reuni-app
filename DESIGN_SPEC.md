# 🧩 Documento de Especificação Visual e Estrutural – Projeto Reuni

---

## 📌 Nome do Projeto
**Reuni** – A Rede Social de Eventos com DNA Social + Nostálgico + Moderno.

---

## 🎨 Identidade Visual

### Paleta de Cores

| Elemento         | Cor Principal    | Código HEX |
|------------------|------------------|------------|
| Primária         | Azul Vibrante    | #2563EB    |
| Secundária       | Rosa Orkut       | #EC4899    |
| Fundo Claro      | Branco Suave     | #F9FAFB    |
| Texto Principal  | Cinza Escuro     | #1F2937    |
| Texto Secundário | Cinza Médio      | #6B7280    |
| Realce (detalhes)| Verde Limão      | #10B981    |

### Tipografia
- **Fonte principal:** `Inter`
- **Título:** `Inter`, 700
- **Texto comum:** `Inter`, 400
- **Citações/Depoimentos:** `Inter`, 500, itálico

---

## 🧭 Layout Inicial: Página Home com 3 Colunas

A página inicial será semelhante ao layout do Instagram, mas com identidade única. Use Tailwind CSS para implementação.

### Estrutura em 3 Colunas:

```
| Sidebar Esquerda | Feed Central     | Sidebar Direita |
|------------------|------------------|------------------|
| - Logo Reuni     | - Feed de eventos| - Amigos indo    |
| - Menu Navegação | - Carrossel      | - Sugestões      |
| - Comunidades    | - Cards          | - Atalhos rápidos|
```

### 1. Sidebar Esquerda
- Logo “Reuni” no topo
- Botões de navegação: 
  - 🏠 Início
  - 📅 Meus Eventos
  - 🧑 Perfil
  - 👥 Comunidades
  - ➕ Criar Evento
- Ícones simples (Heroicons ou Lucide)

### 2. Feed Central
- Carrossel com destaques no topo
- Cards de eventos com:
  - Imagem de capa
  - Nome do evento
  - Data, horário, local
  - Avatar do organizador
  - Botão “Eu Vou” ou “Ver detalhes”
  - Contador de participantes
- Sistema de rolagem infinito

### 3. Sidebar Direita
- Lista de amigos que vão a eventos hoje
- Sugestões de eventos com base no comportamento
- Comunidades populares
- Atalhos de ações rápidas (Ex: "Criar novo evento", "Ver eventos perto de mim")

---

## 🧱 Componentes Visuais

### 🔹 Card de Evento
- Altura média
- Foto no topo com bordas arredondadas
- Área inferior com dados do evento
- Botões: “Eu Vou”, “Detalhes”
- Reações ou emojis populares no rodapé

### 🔹 Perfil de Usuário
- Avatar grande e redondo
- Nome + Bio curta
- Lista: eventos que vai / eventos que criou
- Selos sociais (gamificação)
- Depoimentos estilo Orkut

### 🔹 Comunidade
- Banner de topo
- Mural com postagens de membros
- Eventos vinculados à comunidade
- Contador de membros

---

## 📱 Estilo Geral da Interface

- **Estilo moderno, alegre, leve, mas com toque emocional**
- Animações suaves (ex: hover em botões, rolagem, carregamento)
- Layout mobile-first (mas com responsividade para web)
- Cards e elementos com sombras leves (`shadow-md`, `rounded-xl`)
- Feedback visual constante (ex: botão muda após clicar em “Eu vou”)
- Ícones preenchidos e coloridos para maior emoção

---

## 🧠 Comportamentos Adicionais

- Barra superior fixa com botão de notificação e perfil
- Tema claro com opção de modo escuro futuro
- Alertas visuais para eventos prestes a acontecer
- Quando o usuário confirmar presença em evento: animação leve, som de sino e alteração de status visual

---

## ✅ Objetivo

Este documento serve como referência para IA e desenvolvedores implementarem a home page do projeto **Reuni**, com layout em 3 colunas, identidade visual moderna e foco total na experiência social, emocional e interativa.

---

*Desenvolvido por Raphael Kvasne – evoinfo*