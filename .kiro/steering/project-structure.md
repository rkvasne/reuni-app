---
inclusion: always
---

# Estrutura do Projeto Reuni

## Visão Geral
O Reuni é uma plataforma de eventos sociais construída com Next.js, React, TypeScript, Tailwind CSS e Supabase.

## Arquitetura de Pastas

### `/app` - App Router do Next.js
- Páginas e layouts usando App Router
- Cada pasta representa uma rota
- `layout.tsx` para layouts compartilhados
- `page.tsx` para páginas principais

### `/components` - Componentes React
- Componentes reutilizáveis da UI
- Organizados por funcionalidade quando possível
- Cada componente em arquivo próprio
- Subpasta `/ui` para componentes base

### `/hooks` - Custom Hooks
- Lógica reutilizável de estado e efeitos
- Prefixo `use` obrigatório
- Hooks específicos para Supabase, auth, etc.

### `/lib` - Configurações e Utilitários Core
- `supabase.ts` - Cliente Supabase configurado
- Configurações de bibliotecas externas
- Utilitários fundamentais do sistema

### `/utils` - Funções Utilitárias
- Funções puras e helpers
- Cache, formatação, validação
- Retry logic e error handling

### `/scripts` - Scripts de Automação
- Web scraping de eventos
- Migrações de banco
- Scripts de manutenção

### `/supabase` - Configurações do Banco
- Migrações SQL
- Configurações de RLS
- Schemas e tipos

## Convenções de Nomenclatura
- **Componentes**: PascalCase (`EventCard.tsx`)
- **Hooks**: camelCase com prefixo use (`useAuth.ts`)
- **Utilitários**: camelCase (`imageUtils.ts`)
- **Constantes**: UPPER_SNAKE_CASE
- **Variáveis**: camelCase

## Fluxo de Dados
1. **Supabase** → Fonte de dados
2. **Hooks** → Gerenciamento de estado
3. **Componentes** → Apresentação
4. **Utils** → Transformação de dados

## Padrões de Import
```typescript
// Bibliotecas externas primeiro
import React from 'react'
import { NextPage } from 'next'

// Imports internos
import { useAuth } from '@/hooks/useAuth'
import EventCard from '@/components/EventCard'
import { formatDate } from '@/utils/dateUtils'
```