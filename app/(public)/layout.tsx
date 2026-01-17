export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 患者向けはサイドバーなしのシンプルなレイアウト
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}
