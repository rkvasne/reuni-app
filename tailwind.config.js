/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Estratégica Reuni - Roxo Principal
        primary: {
          50: '#f8f5ff',   // Roxo muito claro (quase lavanda)
          100: '#f0e8ff',  // Roxo claro para backgrounds
          200: '#e1d5ff',  // Roxo suave
          300: '#c7b3ff',  // Roxo médio claro
          400: '#a885ff',  // Roxo médio
          500: '#9B59B6',  // Roxo principal (cor estratégica)
          600: '#8E44AD',  // Roxo escuro para hover/seleção
          700: '#7d3c98',  // Roxo mais escuro
          800: '#6c3483',  // Roxo muito escuro
          900: '#5b2c6f',  // Roxo profundo
        },
        secondary: {
          50: '#faf8ff',   // Roxo secundário muito claro
          100: '#f3f0ff',  // Roxo secundário claro
          200: '#e6e0ff',  // Roxo secundário suave
          300: '#d1c4ff',  // Roxo secundário médio claro
          400: '#b8a3ff',  // Roxo secundário médio
          500: '#8E44AD',  // Roxo escuro (secundário)
          600: '#7d3c98',  // Roxo secundário escuro
          700: '#6c3483',  // Roxo secundário mais escuro
          800: '#5b2c6f',  // Roxo secundário muito escuro
          900: '#4a235a',  // Roxo secundário profundo
        },
        // Cores de ação (tons pastéis e suaves)
        action: {
          blue: '#E3F2FD',    // Azul pastel para navegação
          'blue-text': '#1976D2',
          green: '#E8F5E8',   // Verde pastel para confirmações
          'green-text': '#388E3C',
          orange: '#FFF3E0',  // Laranja pastel para alertas
          'orange-text': '#F57C00',
          gray: '#F5F5F5',    // Cinza pastel para configurações
          'gray-text': '#616161',
        },
        neutral: {
          50: '#F4F4F8',   // Fundo principal suave
          100: '#f8fafc',  // Branco suave
          200: '#E0E0E0',  // Cinza claro
          300: '#d1d5db',  // Cinza médio claro
          400: '#9ca3af',  // Cinza médio
          500: '#6b7280',  // Cinza texto secundário
          600: '#444444',  // Cinza escuro para texto
          700: '#374151',  // Cinza muito escuro
          800: '#1f2937',  // Cinza texto principal
          900: '#111827',  // Cinza profundo
        }
      },
      fontFamily: {
        sans: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'reuni': '0 4px 6px -1px rgba(155, 89, 182, 0.1), 0 2px 4px -1px rgba(155, 89, 182, 0.06)',
        'reuni-lg': '0 10px 15px -3px rgba(155, 89, 182, 0.1), 0 4px 6px -2px rgba(155, 89, 182, 0.05)',
        'reuni-xl': '0 20px 25px -5px rgba(155, 89, 182, 0.1), 0 10px 10px -5px rgba(155, 89, 182, 0.04)',
        'soft': '0 2px 8px rgba(155, 89, 182, 0.08)',
        'glow': '0 0 20px rgba(155, 89, 182, 0.3)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #9B59B6 0%, #8E44AD 100%)',
        'gradient-soft': 'linear-gradient(135deg, #f8f5ff 0%, #f0e8ff 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)',
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
}