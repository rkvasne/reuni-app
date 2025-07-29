# 🌐 Reuni - Rede Social de Eventos

> Conecte pessoas através de eventos reais. Descubra, crie e participe de experiências autênticas.

**Versão:** v0.0.8 ✅ **CONCLUÍDA**  
**Status:** ✅ Pronto para produção

## 🎯 Funcionalidades

- **Eventos**: Criar, descobrir e participar de eventos
- **Comunidades**: Formar grupos por interesses comuns  
- **Busca Avançada**: Filtros inteligentes e sugestões personalizadas
- **Social**: Feed personalizado, calendário interativo, trending
- **Perfil**: Gestão completa de perfil e eventos

## 🚀 Tecnologias

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Deploy**: Vercel

## 🏃‍♂️ Como Executar

```bash
# Clone e instale
git clone https://github.com/seuusuario/reuni.git
cd reuni
npm install

# Configure o Supabase
cp .env.example .env.local
# Adicione suas credenciais do Supabase

# Execute as migrações obrigatórias
# No Supabase SQL Editor, execute:
# - supabase/migrations/011_FINAL_fix_events.sql

# Execute o projeto
npm run dev
```

Acesse: http://localhost:3000

## 📚 Documentação

- **[CHANGELOG.md](./CHANGELOG.md)** - Histórico de versões
- **[ROADMAP.md](./ROADMAP.md)** - Próximos passos
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Solução de problemas
- **[docs/PRD.md](./docs/PRD.md)** - Requisitos do produto

## 👨‍💻 Autor

**Raphael Kvasne** - CEO & Fundador da Evoinfo

## 📄 Licença

MIT License