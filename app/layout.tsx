import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '歯科OS',
  description: '歯科クリニック経営OS',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
