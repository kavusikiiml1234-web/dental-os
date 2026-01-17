'use client'

import { Suspense } from 'react'
import Link from 'next/link'

function InterviewCompleteContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">🦷 〇〇歯科クリニック</h1>
          <p className="text-gray-600 mt-1">WEB問診</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-4xl">✓</span></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">問診のご回答ありがとうございます</h2>
          <p className="text-gray-600">回答内容は担当医に共有されます</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">📋 ご回答内容について</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <p>• ご回答いただいた内容は、電子カルテに自動で反映されます</p>
            <p>• 来院時に改めてご記入いただく必要はありません</p>
            <p>• 追加で確認したいことがあれば、診察時にお伺いします</p>
          </div>
        </div>

        <div className="bg-blue-50 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">📍 来院当日の流れ</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3"><span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</span><div><p className="font-medium text-blue-900">受付でチェックイン</p><p className="text-sm text-blue-700">予約完了時のQRコードをご提示ください</p></div></div>
            <div className="flex items-start gap-3"><span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</span><div><p className="font-medium text-blue-900">保険証の確認</p><p className="text-sm text-blue-700">初診・月初めの方は保険証をご提示ください</p></div></div>
            <div className="flex items-start gap-3"><span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</span><div><p className="font-medium text-blue-900">待合室でお待ちください</p><p className="text-sm text-blue-700">順番になりましたらスマホに通知が届きます</p></div></div>
          </div>
        </div>

        <div className="text-center"><Link href="/booking" className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700">予約トップに戻る</Link></div>
      </main>
    </div>
  )
}

export default function InterviewCompletePage() {
  return <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">読み込み中...</div>}><InterviewCompleteContent /></Suspense>
}
