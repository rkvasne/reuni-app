---
inclusion: always
---

# Configuração do Ambiente de Desenvolvimento

## Scripts NPM Recomendados
Adicione estes scripts ao `package.json`:

```json
{
  "scripts": {
    "dev:debug": "NODE_OPTIONS='--inspect' next dev",
    "test:watch": "jest --watch --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "build:analyze": "ANALYZE=true npm run build",
    "db:types": "supabase gen types typescript --local > types/supabase.ts",
    "db:reset": "supabase db reset --local",
    "storybook": "storybook dev -p 6006"
  }
}
```

## Ferramentas de Desenvolvimento

### 1. **Husky + Lint-staged**
```bash
npm install --save-dev husky lint-staged
npx husky install
```

### 2. **Commitizen**
```bash
npm install --save-dev commitizen cz-conventional-changelog
```

### 3. **Bundle Analyzer**
```bash
npm install --save-dev @next/bundle-analyzer
```

### 4. **Storybook** (para componentes)
```bash
npx storybook@latest init
```

## Configurações VSCode
Crie `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

## Extensões VSCode Recomendadas
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- TypeScript Importer
- Auto Rename Tag
- Bracket Pair Colorizer
- GitLens
- Thunder Client (para testar APIs)