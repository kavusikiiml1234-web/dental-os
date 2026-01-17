'use client'

import { useEffect, useState } from 'react'
import { supabase, Reservation } from '@/lib/supabase'
import Link from 'next/link'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

export default function Dashboard() {
  const [todayReservations, setTodayReservations] = useState<Reservation[]>([])
  const [stats, setStats] = useState({
    today: 0,
    confirmed: 0,
    checkedIn: 0,
    completed: 0
  })
  const [loading, setLoading] = useState(true)

  const today = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    
    // 今日の予約を取得
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        patients (
          id, name_last, name_first, phone
        ),
        units (
          id, name, unit_number
        )
      `)
      .eq('reservation_date', today)
      .neq('status', 'cancelled')
      .order('start_time')

    if (!error && data) {
      setTodayReservations(data)
      setStats({
        today: data.length,
        confirmed: data.filter(r => r.status === 'confirmed').length,
        checkedIn: data.filter(r => r.status === 'checked_in').length,
        completed: data.filter(r => r.status === 'completed').length
      })
    }
    
    setLoading(false)
  }

  const categoryLabels: Record<string, string> = {
    first_visit: '初診',
    checkup: '定期検診',
    treatment: '治療',
    consultation: '相談',
    emergency: '急患',
    other: 'その他',
  }

  const statusLabels: Record<string, string> = {
    tentative: '仮予約',
    confirmed: '予約確定',
    checked_in: '来院済',
    in_progress: '診察中',
    completed: '完了',
    cancelled: 'キャンセル',
    no_show: '無断キャンセル',
  }

  const statusColors: Record<string, string> = {
    tentative: 'bg-gray-100 text-gray-700',
    confirmed: 'bg-blue-100 text-blue-700',
    checked_in: 'bg-green-100 text-green-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-red-100 text-red-700',
    no_show: 'bg-red-100 text-red-700',
  }

  return (
    <div className="p-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ダッシュボード</h1>
          <p className="text-gray-500">
            {format(new Date(), 'yyyy年M月d日(E)', { locale: ja })}
          </p>
        </div>
        <Link
          href="/reservations/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <span>＋</span>
          <span>新規予約</span>
        </Link>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-500">今日の予約</p>
          <p className="text-3xl font-bold text-gray-800">{stats.today}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-500">予約確定</p>
          <p className="text-3xl font-bold text-blue-600">{stats.confirmed}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-500">来院済</p>
          <p className="text-3xl font-bold text-green-600">{stats.checkedIn}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-500">診察完了</p>
          <p className="text-3xl font-bold text-gray-600">{stats.completed}</p>
        </div>
      </div>

      {/* 今日の予約一覧 */}
      <div className="bg-white rounded-xl shadow">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">今日の予約</h2>
          <Link href="/calendar" className="text-blue-600 text-sm hover:underline">
            カレンダーを見る →
          </Link>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-500">読み込み中...</div>
        ) : todayReservations.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            今日の予約はありません
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">時間</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">患者名</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ユニット</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">種別</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ステータス</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">備考</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {todayReservations.map((reservation) => (
                  <tr key={reservation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {reservation.start_time?.slice(0, 5)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {reservation.patients?.name_last} {reservation.patients?.name_first}
                      </div>
                      <div className="text-xs text-gray-500">
                        {reservation.patients?.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {reservation.units?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {categoryLabels[reservation.category || ''] || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[reservation.status]}`}>
                        {statusLabels[reservation.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {reservation.note || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/reservations/${reservation.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        詳細
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
