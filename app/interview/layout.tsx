import '../globals.css'

export default function InterviewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 患者向けページはサイドバーなしのシンプルなレイアウト
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}
