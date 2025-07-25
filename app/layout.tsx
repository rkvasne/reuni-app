import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import LayoutClient from './LayoutClient'
import './globals.css'

export const metadata: Metadata = {
  title: 'Reuni - Conecte-se através de eventos reais',
  description: 'A rede social de eventos que conecta pessoas através de experiências autênticas',
}

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  )
}