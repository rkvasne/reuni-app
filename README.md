# 🌐 Rede Social de Eventos – Projeto "Reuni" (codinome)

> Uma rede social moderna e emocionalmente conectada, inspirada na nostalgia do Orkut e na dinâmica social do Instagram – centrada em eventos reais.

---

## 📌 Visão Geral

**Eventum** é uma plataforma web responsiva onde os usuários podem criar, explorar e participar de eventos de todos os tipos — como shows, missas, palestras, pedaladas, cultos, corridas, cursos e muito mais.  
É também uma rede social: os usuários podem seguir organizadores, confirmar presença, interagir com outros participantes e participar de comunidades temáticas.

---

## 🚀 Tecnologias Utilizadas

| Camada         | Stack Tecnológico                           |
|----------------|----------------------------------------------|
| Frontend       | Next.js 14, React, Tailwind CSS              |
| Backend        | Supabase (PostgreSQL, Auth, Storage)         |
| Autenticação   | Supabase Auth (Email, Google, Apple)         |
| UI/UX          | Mobile-first, Lucide Icons, Heroicons        |
| Mapa/Localização | Google Maps API (ou alternativa gratuita)  |

---

## 📁 Estrutura Inicial do Projeto

```
/eventum
├── /app
│   ├── /components
│   │   ├── EventCard.tsx
│   │   ├── Header.tsx
│   │   └── ...
│   ├── /pages
│   │   ├── index.tsx
│   │   ├── login.tsx
│   │   ├── evento/[id].tsx
│   │   └── perfil/[id].tsx
│   ├── /lib
│   │   └── supabase.ts
│   └── /styles
│       └── globals.css
├── .env.local
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

---

## 🧠 Funcionalidades do MVP

- ✅ Autenticação (email/senha, Google, Apple)
- ✅ Feed de eventos com filtros
- ✅ Criação/edição de eventos com upload de imagem
- ✅ Confirmação de presença + comentários
- ✅ Perfil do usuário (eventos criados, confirmados)
- ✅ Explorar eventos por localização, categoria, popularidade
- ✅ Comunidades (estrutura inicial)
- ✅ Design mobile-first com UX fluida

---

## 🗃️ Modelo de Dados (Schemas Supabase)

### `usuarios`
- `id`: UUID
- `nome`, `email`, `avatar`, `bio`
- `created_at`

### `eventos`
- `id`, `titulo`, `descricao`, `data`, `hora`, `local`, `categoria`, `imagem_url`, `organizador_id`

### `presencas`
- `id`, `evento_id`, `usuario_id`, `status` (ex: confirmado, interessado)

### `comentarios`
- `id`, `evento_id`, `usuario_id`, `conteudo`, `created_at`

### `comunidades`
- `id`, `nome`, `descricao`, `tipo`, `criador_id`

---

## 📦 Como Rodar Localmente

```bash
# 1. Clone o repositório
git clone https://github.com/seuusuario/eventum.git
cd eventum

# 2. Instale as dependências
npm install

# 3. Configure variáveis do Supabase
cp .env.example .env.local
# Preencha com URL e chave pública do Supabase

# 4. Rode o app
npm run dev
```

---

## 💡 Funcionalidades Futuras

- 🎫 Ingressos com pagamentos integrados
- 🔔 Notificações em tempo real
- 📍 Geolocalização de eventos ao vivo
- 🏆 Gamificação (badges, rankings)
- 📸 Álbum de fotos colaborativo
- 💬 Chat entre participantes
- 📣 Eventos patrocinados (ads)

---

## 🧪 Testes e Deploy

- Deploy recomendado via [Vercel](https://vercel.com)
- CI/CD básico configurável via GitHub Actions
- Testes unitários futuros com Vitest/Playwright

---

## 👨‍💻 Desenvolvedor Principal

Raphael Kvasne – CEO & Fundador da Evoinfo  
🚀 Construindo o futuro das conexões reais por meio da tecnologia.

---

## 📄 Licença

MIT — sinta-se livre para colaborar, adaptar ou expandir.