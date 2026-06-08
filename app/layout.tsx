import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { StoreProvider } from '@/lib/state/store'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
})

export const metadata: Metadata = {
  title: 'Capillary · Presales solutioning',
  description:
    'Structured discovery capture and deterministic loyalty business-case modeler for the Capillary presales / Solution Architect team.',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  )
}
