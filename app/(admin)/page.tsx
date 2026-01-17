'use client'

import { useEffect, useState } from 'react'
import { supabase, Reservation } from '@/lib/supabase'
import Link from 'next/link'
import { format, addDays, subDays } from 'date-fns'
import { ja } from 'date-fns/locale'

export default function Dashboard() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [stats, setStats] = useState({ total: 0, confirmed: 0, checkedIn: 0, completed: 0, webBooking: 0, interviewDone: 0 })
  const [monthlyStats, setMonthlyStats] = useState({ totalPatients: 0, newPatients: 0, totalReservations: 0 })
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [filterSource, setFilterSource] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => { fetchData() }, [selectedDate, filterSource, filterStatus])
  useEffect(() => { fetchMonthlyStats() }, [])

  async function fetchData() {
    setLoading(true)
    
    let query = supabase
      .from('reservations')
      .select(`*, patients (id, name_last, name_first, phone), units (id, name, unit_number)`)
      .eq('reservation_date', selectedDate)
      .neq('status', 'cancelled')
      .order('start_time')

    if (filterSource !== 'all') {
      query = query.eq('source', filterSource)
    }
    if (filterStatus !== 'all') {
      query = query.eq('status', filterStatus)
    }

    const { data, error } = await query

    if (!error && data) {
      let filtered = data
      if (searchQuery) {
        filtered = data.filter(r => 
          r.patients?.name_last?.includes(searchQuery) ||
          r.patients?.name_first?.includes(searchQuery) ||
          r.patients?.phone?.includes(searchQuery)
        )
      }
      setReservations(filtered)
      setStats({
        total: data.length,
        confirmed: data.filter(r => r.status === 'confirmed').length,
        checkedIn: data.filter(r => r.status === 'checked_in').length,
        completed: data.filter(r => r.status === 'completed').length,
        webBooking: data.filter(r => r.source === 'web').length,
        interviewDone: data.filter(r => r.interview_completed).length
      })
    }
    setLoading(false)
  }

  async function fetchMonthlyStats() {
    const startOfMonth = format(new Date(), 'yyyy-MM-01')
    const endOfMonth = format(new Date(), 'yyyy-MM-31')
    
    // 今月の予約数
    const { count: reservationCount } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .gte('reservation_date', startOfMonth)
      .lte('reservation_date', endOfMonth)
    
    // 総患者数
    const { count: patientCount } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
    
    // 今月の新規患者
    const { count: newPatientCount } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth)
    
    setMonthlyStats({
      totalPatients: patientCount || 0,
      newPatients: newPatientCount || 0,
      totalReservations: reservationCount || 0
    })
  }

  function handleSearch() {
    fetchData()
  }

  const categoryLabels: Record<string, string> = {
    first_visit: '初診', checkup: '定期検診', treatment: '治療',
    consultation: '相談', emergency: '急患', other: 'その他',
  }

  const statusLabels: Record<string, string> = {
    tentative: '仮予約', confirmed: '予約確定', checked_in: '来院済',
    in_progress: '診察中', completed: '完了', cancelled: 'キャンセル', no_show: '無断キャンセル',
  }

  const statusColors: Record<string, string> = {
    tentative: 'bg-gray-100 text-gray-700', confirmed: 'bg-blue-100 text-blue-700',
    checked_in: 'bg-green-100 text-green-700', in_progress: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-gray-100 text-gray-700', cancelled: 'bg-red-100 text-red-700', no_show: 'bg-red-100 text-red-700',
  }

  const sourceLabels: Record<string, { label: string; color: string }> = {
    web: { label: 'Web予約', color: 'bg-purple-100 text-purple-700' },
    manual: { label: '手動', color: 'bg-gray-100 text-gray-600' },
    phone: { label: '電話', color: 'bg-orange-100 text-orange-700' },
    line: { label: 'LINE', color: 'bg-green-100 text-green-700' },
    ai_phone: { label: 'AI電話', color: 'bg-blue-100 text-blue-700' },
  }

  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="p-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ダッシュボード</h1>
          <p className="text-gray-500">{format(new Date(), 'yyyy年M月d日(E)', { locale: ja })}</p>
        </div>
        <Link href="/reservations/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
          <span>＋</span><span>新規予約</span>
        </Link>
      </div>

      {/* 月間統計 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow p-4 text-white">
          <p className="text-sm opacity-80">総患者数</p>
          <p className="text-3xl font-bold">{monthlyStats.totalPatients.toLocaleString()}</p>
          <p className="text-xs opacity-70 mt-1">登録済み患者</p>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow p-4 text-white">
          <p className="text-sm opacity-80">今月の新規患者</p>
          <p className="text-3xl font-bold">{monthlyStats.newPatients}</p>
          <p className="text-xs opacity-70 mt-1">{format(new Date(), 'M月')}の新規登録</p>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow p-4 text-white">
          <p className="text-sm opacity-80">今月の予約数</p>
          <p className="text-3xl font-bold">{monthlyStats.totalReservations}</p>
          <p className="text-xs opacity-70 mt-1">{format(new Date(), 'M月')}の総予約</p>
        </div>
      </div>

      {/* 日付選択 */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedDate(format(subDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              ←
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border rounded-lg px-3 py-2"
            />
            <button
              onClick={() => setSelectedDate(format(addDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              →
            </button>
            {!isToday && (
              <button
                onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
                className="ml-2 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
              >
                今日に戻る
              </button>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500">経路:</label>
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">すべて</option>
                <option value="web">Web予約</option>
                <option value="phone">電話</option>
                <option value="manual">手動</option>
                <option value="line">LINE</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500">状態:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">すべて</option>
                <option value="confirmed">予約確定</option>
                <option value="checked_in">来院済</option>
                <option value="in_progress">診察中</option>
                <option value="completed">完了</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 当日統計カード */}
      <div className="grid grid-cols-6 gap-3 mb-6">
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-xs text-gray-500">{isToday ? '今日' : format(new Date(selectedDate), 'M/d')}の予約</p>
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-xs text-gray-500">予約確定</p>
          <p className="text-2xl font-bold text-blue-600">{stats.confirmed}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-xs text-gray-500">来院済</p>
          <p className="text-2xl font-bold text-green-600">{stats.checkedIn}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-xs text-gray-500">診察完了</p>
          <p className="text-2xl font-bold text-gray-600">{stats.completed}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-purple-500">
          <p className="text-xs text-gray-500">Web予約</p>
          <p className="text-2xl font-bold text-purple-600">{stats.webBooking}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-emerald-500">
          <p className="text-xs text-gray-500">問診完了</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.interviewDone}</p>
        </div>
      </div>

      {/* 予約一覧 */}
      <div className="bg-white rounded-xl shadow">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">
            {isToday ? '今日' : format(new Date(selectedDate), 'M月d日(E)', { locale: ja })}の予約
            <span className="ml-2 text-sm font-normal text-gray-500">({stats.total}件)</span>
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="患者名・電話番号で検索..."
              className="border rounded-lg px-3 py-1 text-sm w-48"
            />
            <Link href="/calendar" className="text-blue-600 text-sm hover:underline flex items-center">カレンダー →</Link>
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-500">読み込み中...</div>
        ) : reservations.length === 0 ? (
          <div className="p-6 text-center text-gray-500">予約はありません</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">時間</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">患者名</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">予約経路</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">種別</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ステータス</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">問診</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reservations.map((reservation) => (
                  <tr key={reservation.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {reservation.start_time?.slice(0, 5)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {reservation.patients?.name_last} {reservation.patients?.name_first}
                      </div>
                      <div className="text-xs text-gray-500">{reservation.patients?.phone}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {reservation.source && sourceLabels[reservation.source] ? (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${sourceLabels[reservation.source].color}`}>
                          {sourceLabels[reservation.source].label}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {categoryLabels[reservation.category || ''] || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[reservation.status]}`}>
                        {statusLabels[reservation.status]}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {reservation.interview_completed ? (
                        <span className="text-green-600 font-medium">✓ 完了</span>
                      ) : (
                        <span className="text-gray-400">未回答</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm space-x-3">
                      <Link 
                        href={`/charts/${reservation.patient_id}`} 
                        className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100 transition"
                      >
                        📋 カルテ
                      </Link>
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
