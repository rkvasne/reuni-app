# 🔧 Correções de Eventos - Scraping e Exibição

## ❌ **Problemas Identificados**

### **1. Script de Scraping**
- ❌ **Informações no título**: Data, hora e local misturados no título
- ❌ **Data incorreta**: Usando data atual em vez da data do evento
- ❌ **Campos vazios**: Hora e local não preenchidos corretamente

### **2. Exibição dos Cards**
- ❌ **Badge "HOJE"**: Todos os eventos mostrando como hoje
- ❌ **Fundo muito claro**: Cards não se destacam da página
- ❌ **Data errada**: Usando `created_at` em vez de `data` do evento

## ✅ **Correções Implementadas**

### **1. Script de Scraping Corrigido**

#### **Extração Inteligente de Informações**
```javascript
// Novo método: extrairInformacoesDoTitulo()
extrairInformacoesDoTitulo(titulo) {
  // Padrões de data: "30 de nov", "12/10/2024"
  // Padrões de hora: "19:00", "19h30", "às 20:00"
  // Padrões de local: "- Porto Velho, RO"
  
  return {
    titulo: tituloLimpo,    // Sem data/hora/local
    data: dataExtraida,     // "30 de nov"
    hora: horaExtraida,     // "19:00:00"
    local: localExtraido    // "Porto Velho, RO"
  }
}
```

#### **Processamento de Datas**
```javascript
// Converter "30 de nov" para "2024-11-30"
converterDataPortugues(dataTexto) {
  const meses = {
    'jan': '01', 'fev': '02', 'mar': '03', 'abr': '04',
    'mai': '05', 'jun': '06', 'jul': '07', 'ago': '08',
    'set': '09', 'out': '10', 'nov': '11', 'dez': '12'
  };
  
  // Se mês já passou, usar ano que vem
  const ano = parseInt(mes) < mesAtual ? anoProximo : anoAtual;
  return `${ano}-${mes}-${dia}`;
}
```

#### **Exemplo de Transformação**
```javascript
// ANTES:
titulo: "2ª PVH CITY HALF MARATHON 2025. 5K - 10K - 21K Espaço Alternativo de Porto Velho - Porto Velho, RO Domingo, 30 de jul às 19:00"
data: "2024-12-30" // Data do scraping
hora: "19:00:00"   // Padrão
local: "São Paulo, SP" // Padrão

// DEPOIS:
titulo: "2ª PVH CITY HALF MARATHON 2025. 5K - 10K - 21K"
data: "2025-07-30" // Data real do evento
hora: "19:00:00"   // Extraída do título
local: "Espaço Alternativo de Porto Velho - Porto Velho, RO" // Extraído
```

### **2. Script de Correção de Eventos Existentes**

#### **fix-existing-events.js**
```bash
# Corrige eventos já salvos no banco
node scripts/scraping/fix-existing-events.js
```

**Funcionalidades:**
- ✅ **Extrai informações** dos títulos existentes
- ✅ **Limpa títulos** removendo data/hora/local
- ✅ **Corrige datas** para datas reais dos eventos
- ✅ **Atualiza campos** hora e local quando encontrados
- ✅ **Preserva dados** originais quando não há informação melhor

### **3. Cards com Fundo Melhorado**

#### **CSS Atualizado**
```css
.event-card {
  background-color: #ffffff; /* Branco puro */
  border: 1px solid rgba(0, 0, 0, 0.12); /* Borda mais visível */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08);
}
```

### **4. Badge de Data Corrigido**

#### **EventDateBadge Funcionando**
```typescript
// Usa a data correta do evento (campo 'data')
<EventDateBadge date={event.data} />

// Lógica correta:
- HOJE: Verde quando event.data === hoje
- AMANHÃ: Laranja quando event.data === amanhã  
- OUTRAS: Azul com DD/MMM
```

## 🎯 **Resultados Esperados**

### **Antes das Correções**
```
Título: "2ª PVH CITY HALF MARATHON 2025 Porto Velho, RO Domingo, 30 de jul às 19:00"
Data: 2024-12-30 (data do scraping)
Hora: 19:00:00 (padrão)
Local: São Paulo, SP (padrão)
Badge: HOJE (incorreto)
```

### **Depois das Correções**
```
Título: "2ª PVH CITY HALF MARATHON 2025"
Data: 2025-07-30 (data real do evento)
Hora: 19:00:00 (extraída do título)
Local: Porto Velho, RO (extraído do título)
Badge: 30 JUL (correto)
```

## 🚀 **Como Aplicar as Correções**

### **1. Corrigir Eventos Existentes**
```bash
cd scripts/scraping
node fix-existing-events.js
```

### **2. Próximos Scrapings**
```bash
# O script já está corrigido
node scrape-eventos-completo.js
```

### **3. Verificar Resultados**
- ✅ **Títulos limpos** sem data/hora/local
- ✅ **Badges corretos** mostrando data real
- ✅ **Cards destacados** com fundo branco
- ✅ **Informações organizadas** nos campos corretos

## 📊 **Padrões Suportados**

### **Datas**
- ✅ "30 de nov", "12 de dezembro"
- ✅ "30/11/2024", "12/10"
- ✅ "Domingo, 30 de nov"

### **Horas**
- ✅ "19:00", "19h30", "20h"
- ✅ "às 19:00", "às 20h30"

### **Locais**
- ✅ "- Porto Velho, RO"
- ✅ "em São Paulo, SP"
- ✅ "no Centro de Eventos"

## 🎉 **Resultado Final**

Agora o sistema:
- 🎯 **Extrai informações** corretamente dos títulos
- 📅 **Mostra datas reais** dos eventos nos badges
- 🎨 **Cards destacados** com fundo branco
- 📋 **Campos organizados** (título, data, hora, local)
- ✨ **UX melhorada** com informações precisas

**Execute o script de correção para atualizar os eventos existentes!** 🔧