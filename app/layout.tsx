import './globals.css'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '歯科予約システム',
  description: '歯科クリニックの予約管理システム',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="bg-gray-100 min-h-screen">
        <div className="flex min-h-screen">
          {/* サイドバー */}
          <aside className="w-64 bg-slate-800 text-white flex flex-col">
            <div className="p-4 border-b border-slate-700">
              <h1 className="text-lg font-bold flex items-center gap-2">
                🦷 歯科OS
              </h1>
              <p className="text-xs text-slate-400 mt-1">予約管理システム</p>
            </div>
            
            <nav className="flex-1 p-4">
              <ul className="space-y-2">
                <li>
                  <Link 
                    href="/" 
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700 transition"
                  >
                    <span>📊</span>
                    <span>ダッシュボード</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/calendar" 
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700 transition"
                  >
                    <span>📅</span>
                    <span>予約カレンダー</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/reservations" 
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700 transition"
                  >
                    <span>📋</span>
                    <span>予約一覧</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/patients" 
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700 transition"
                  >
                    <span>👥</span>
                    <span>患者管理</span>
                  </Link>
                </li>
                
                <li className="pt-4 mt-4 border-t border-slate-700">
                  <span className="text-xs text-slate-500 px-3">設定</span>
                </li>
                <li>
                  <Link 
                    href="/settings/units" 
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700 transition"
                  >
                    <span>🪑</span>
                    <span>ユニット管理</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/settings/staff" 
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700 transition"
                  >
                    <span>👤</span>
                    <span>スタッフ管理</span>
                  </Link>
                </li>
              </ul>
            </nav>

            <div className="p-4 border-t border-slate-700">
              <p className="text-xs text-slate-500">Version 1.0.0</p>
            </div>
          </aside>

          {/* メインコンテンツ */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
