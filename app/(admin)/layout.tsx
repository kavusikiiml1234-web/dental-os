import Link from 'next/link'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* サイドバー */}
      <aside className="w-64 bg-slate-800 text-white flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <h1 className="text-lg font-bold flex items-center gap-2">
            🦷 歯科OS
          </h1>
          <p className="text-xs text-slate-400 mt-1">クリニック管理システム</p>
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
              <span className="text-xs text-slate-500 px-3">患者向けページ</span>
            </li>
            <li>
              <Link 
                href="/checkin" 
                target="_blank"
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700 transition"
              >
                <span>🏥</span>
                <span>チェックイン端末</span>
                <span className="text-xs bg-green-600 px-1.5 py-0.5 rounded">NEW</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/booking" 
                target="_blank"
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700 transition"
              >
                <span>📱</span>
                <span>Web予約ページ</span>
              </Link>
            </li>
            
            <li className="pt-4 mt-4 border-t border-slate-700">
              <span className="text-xs text-slate-500 px-3">設定</span>
            </li>
            <li>
              <Link 
                href="/settings/checkin-qr" 
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700 transition"
              >
                <span>📱</span>
                <span>チェックインQR</span>
                <span className="text-xs bg-green-600 px-1.5 py-0.5 rounded">NEW</span>
              </Link>
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
          <p className="text-xs text-slate-500">Version 3.0.0</p>
        </div>
      </aside>

      {/* メインコンテンツ */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
