'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

function BookingCompleteContent() {
  const searchParams = useSearchParams()
  const reservationId = searchParams.get('reservation_id')
  const patientId = searchParams.get('patient_id')
  const [reservation, setReservation] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (reservationId) fetchReservation() }, [reservationId])

  async function fetchReservation() {
    const { data } = await supabase.from('reservations').select(`*, patients (*)`).eq('id', reservationId).single()
    if (data) setReservation(data)
    setLoading(false)
  }

  const categoryLabels: {[key: string]: string} = { first_visit: '初診', checkup: '定期検診', treatment: '治療', consultation: '相談', emergency: '急患' }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">読み込み中...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">🦷 〇〇歯科クリニック</h1>
          <p className="text-gray-600 mt-1">Web予約</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-4xl">✓</span></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">ご予約が完了しました</h2>
          <p className="text-gray-600">ご予約ありがとうございます</p>
        </div>

        {reservation && (
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">ご予約内容</h3>
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-blue-800 mb-1">ご予約日時</p>
              <p className="text-xl font-bold text-blue-900">{format(new Date(reservation.reservation_date + 'T00:00:00'), 'yyyy年M月d日(E)', { locale: ja })}</p>
              <p className="text-xl font-bold text-blue-900">{reservation.start_time?.slice(0, 5)}〜</p>
            </div>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-gray-500">お名前</dt><dd className="font-medium">{reservation.patients?.name_last} {reservation.patients?.name_first}</dd></div>
              <div><dt className="text-gray-500">電話番号</dt><dd className="font-medium">{reservation.patients?.phone}</dd></div>
              <div><dt className="text-gray-500">診療内容</dt><dd className="font-medium">{categoryLabels[reservation.category]}</dd></div>
              <div><dt className="text-gray-500">予約番号</dt><dd className="font-medium text-xs">{reservationId?.slice(0, 8)}</dd></div>
            </dl>
          </div>
        )}

        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">📋</span>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-yellow-800 mb-2">【重要】来院前にWEB問診にご回答ください</h3>
              <p className="text-yellow-700 text-sm mb-4">来院前に問診にご回答いただくと、当日の待ち時間を短縮できます。所要時間は約3〜5分です。</p>
              <Link href={`/interview?reservation_id=${reservationId}&patient_id=${patientId}`} className="inline-block bg-yellow-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-yellow-600">📝 WEB問診に回答する</Link>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📍 来院時のご案内</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3"><span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</span><div><p className="font-medium">QRコードでチェックイン</p><p className="text-sm text-gray-600">受付にてQRコードを読み取ってください</p></div></div>
            <div className="flex items-start gap-3"><span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</span><div><p className="font-medium">保険証をご提示ください</p><p className="text-sm text-gray-600">初診の方、月初めの方は保険証をお持ちください</p></div></div>
            <div className="flex items-start gap-3"><span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</span><div><p className="font-medium">待合室でお待ちください</p><p className="text-sm text-gray-600">スマホに呼出し通知が届きます</p></div></div>
          </div>
        </div>

        <div className="text-center"><Link href="/booking" className="text-blue-600 hover:underline">← 予約トップに戻る</Link></div>
      </main>
    </div>
  )
}

export default function BookingCompletePage() {
  return <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">読み込み中...</div>}><BookingCompleteContent /></Suspense>
}
