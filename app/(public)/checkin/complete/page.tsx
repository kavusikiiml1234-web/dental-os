'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function CompleteContent() {
  const searchParams = useSearchParams()
  const reservationId = searchParams.get('reservation_id')
  const noInsurance = searchParams.get('no_insurance')
  
  const [reservation, setReservation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [waitingNumber, setWaitingNumber] = useState<number | null>(null)

  useEffect(() => {
    if (reservationId) fetchReservation()
  }, [reservationId])

  async function fetchReservation() {
    const { data } = await supabase
      .from('reservations')
      .select(`*, patients (*)`)
      .eq('id', reservationId)
      .single()
    
    if (data) {
      setReservation(data)
      
      // 待ち番号を計算（今日のチェックイン順）
      const { count } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('reservation_date', data.reservation_date)
        .eq('status', 'checked_in')
        .lt('checked_in_at', data.checked_in_at)
      
      setWaitingNumber((count || 0) + 1)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <main className="max-w-lg mx-auto px-4 py-12">
        {/* 完了メッセージ */}
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">✓</span>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            チェックイン完了
          </h1>
          <p className="text-gray-600">
            {reservation?.patients?.name_last} {reservation?.patients?.name_first} 様
          </p>

          {/* 待ち番号 */}
          {waitingNumber && (
            <div className="mt-8 p-6 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-600 mb-2">受付番号</p>
              <p className="text-6xl font-bold text-blue-600">{waitingNumber}</p>
            </div>
          )}

          {/* 予約情報 */}
          <div className="mt-8 text-left bg-gray-50 rounded-xl p-4">
            <h3 className="font-medium text-gray-800 mb-3">ご予約内容</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">予約時間</dt>
                <dd className="font-medium">{reservation?.start_time?.slice(0, 5)}〜</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">診察内容</dt>
                <dd className="font-medium">
                  {reservation?.category === 'first_visit' ? '初診' :
                   reservation?.category === 'checkup' ? '定期検診' :
                   reservation?.category === 'treatment' ? '治療' : '診察'}
                </dd>
              </div>
            </dl>
          </div>

          {/* 注意事項 */}
          {noInsurance && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-left">
              <p className="text-sm text-yellow-800">
                ⚠️ 保険証の確認がお済みではありません。<br />
                受付にて保険証をご提示ください。
              </p>
            </div>
          )}

          {/* 案内 */}
          <div className="mt-8 p-4 bg-gray-50 rounded-xl text-left">
            <h3 className="font-medium text-gray-800 mb-2">📍 次のステップ</h3>
            <ol className="text-sm text-gray-600 space-y-2">
              <li className="flex gap-2">
                <span className="bg-blue-100 text-blue-600 w-5 h-5 rounded-full flex items-center justify-center text-xs">1</span>
                <span>待合室でお待ちください</span>
              </li>
              <li className="flex gap-2">
                <span className="bg-blue-100 text-blue-600 w-5 h-5 rounded-full flex items-center justify-center text-xs">2</span>
                <span>お名前をお呼びします</span>
              </li>
              <li className="flex gap-2">
                <span className="bg-blue-100 text-blue-600 w-5 h-5 rounded-full flex items-center justify-center text-xs">3</span>
                <span>診察室へお入りください</span>
              </li>
            </ol>
          </div>

          <p className="mt-8 text-xs text-gray-400">
            この画面は閉じても大丈夫です
          </p>
        </div>
      </main>
    </div>
  )
}

export default function CompletePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">読み込み中...</div>}>
      <CompleteContent />
    </Suspense>
  )
}
