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
        // Paleta oficial do Reuni
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#2563EB', // Azul vibrante principal
          600: '#1d4ed8',
          700: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#fdf2f8',
          100: '#fce7f3',
          500: '#EC4899', // Rosa nostálgico
          600: '#db2777',
          700: '#be185d',
        },
        accent: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10B981', // Verde limão para realces
          600: '#059669',
          700: '#047857',
        },
        neutral: {
          50: '#F9FAFB',  // Fundo claro
          100: '#f3f4f6',
          600: '#6B7280',  // Texto secundário
          800: '#1F2937',  // Texto principal
          900: '#111827',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'reuni': '0 4px 6px -1px rgba(37, 99, 235, 0.1), 0 2px 4px -1px rgba(37, 99, 235, 0.06)',
        'reuni-lg': '0 10px 15px -3px rgba(37, 99, 235, 0.1), 0 4px 6px -2px rgba(37, 99, 235, 0.05)',
      }
    },
  },
  plugins: [],
}