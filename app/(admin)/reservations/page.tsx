'use client'

import { useEffect, useState } from 'react'
import { supabase, Reservation } from '@/lib/supabase'
import Link from 'next/link'
import { format, subDays, addDays } from 'date-fns'
import { ja } from 'date-fns/locale'

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [dateTo, setDateTo] = useState(format(addDays(new Date(), 7), 'yyyy-MM-dd'))
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => { fetchReservations() }, [dateFrom, dateTo, statusFilter, sourceFilter])

  async function fetchReservations() {
    setLoading(true)
    let query = supabase.from('reservations')
      .select(`*, patients (id, name_last, name_first, phone), units (id, name, unit_number)`)
      .gte('reservation_date', dateFrom).lte('reservation_date', dateTo)
      .order('reservation_date').order('start_time')
    if (statusFilter !== 'all') query = query.eq('status', statusFilter)
    if (sourceFilter !== 'all') query = query.eq('source', sourceFilter)
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
    }
    setLoading(false)
  }

  const categoryLabels: Record<string, string> = { first_visit: '初診', checkup: '定期検診', treatment: '治療', consultation: '相談', emergency: '急患', other: 'その他' }
  const statusLabels: Record<string, string> = { tentative: '仮予約', confirmed: '予約確定', checked_in: '来院済', in_progress: '診察中', completed: '完了', cancelled: 'キャンセル', no_show: '無断キャンセル' }
  const statusColors: Record<string, string> = { tentative: 'bg-gray-100 text-gray-700', confirmed: 'bg-blue-100 text-blue-700', checked_in: 'bg-green-100 text-green-700', in_progress: 'bg-yellow-100 text-yellow-700', completed: 'bg-gray-100 text-gray-700', cancelled: 'bg-red-100 text-red-700', no_show: 'bg-red-100 text-red-700' }
  const sourceLabels: Record<string, { label: string; color: string }> = {
    web: { label: 'Web予約', color: 'bg-purple-100 text-purple-700' },
    manual: { label: '手動', color: 'bg-gray-100 text-gray-600' },
    phone: { label: '電話', color: 'bg-orange-100 text-orange-700' },
    line: { label: 'LINE', color: 'bg-green-100 text-green-700' },
    ai_phone: { label: 'AI電話', color: 'bg-blue-100 text-blue-700' },
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">予約一覧</h1>
        <Link href="/reservations/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">＋ 新規予約</Link>
      </div>

      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">開始日</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">終了日</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
              <option value="all">すべて</option>
              <option value="confirmed">予約確定</option>
              <option value="checked_in">来院済</option>
              <option value="completed">完了</option>
              <option value="cancelled">キャンセル</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">予約経路</label>
            <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
              <option value="all">すべて</option>
              <option value="web">Web予約</option>
              <option value="phone">電話</option>
              <option value="manual">手動</option>
              <option value="line">LINE</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">患者検索</label>
            <input 
              type="text" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchReservations()}
              placeholder="患者名・電話番号" 
              className="border rounded-lg px-3 py-2 text-sm w-40" 
            />
          </div>
          <div className="text-sm text-gray-500 ml-auto">{reservations.length} 件</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? <div className="p-6 text-center text-gray-500">読み込み中...</div> : reservations.length === 0 ? <div className="p-6 text-center text-gray-500">該当する予約はありません</div> : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">日付</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">時間</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">患者名</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">経路</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">種別</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ステータス</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">問診</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reservations.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{format(new Date(r.reservation_date + 'T00:00:00'), 'M/d(E)', { locale: ja })}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{r.start_time?.slice(0, 5)}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{r.patients?.name_last} {r.patients?.name_first}</div>
                    <div className="text-xs text-gray-500">{r.patients?.phone}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {r.source && sourceLabels[r.source] ? (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${sourceLabels[r.source].color}`}>
                        {sourceLabels[r.source].label}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{categoryLabels[r.category || ''] || '-'}</td>
                  <td className="px-4 py-4 whitespace-nowrap"><span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[r.status]}`}>{statusLabels[r.status]}</span></td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    {r.interview_completed ? (
                      <span className="text-green-600 font-medium">✓ 完了</span>
                    ) : (
                      <span className="text-gray-400">未回答</span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm space-x-2">
                    <Link href={`/charts/${r.patient_id}`} className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100">📋</Link>
                    <Link href={`/reservations/${r.id}`} className="text-blue-600 hover:underline">詳細</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
