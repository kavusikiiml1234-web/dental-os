'use client'

import { useState, useEffect } from 'react'
import { supabase, Reservation, Unit } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

export default function ReservationDetail() {
  const router = useRouter()
  const params = useParams()
  const reservationId = params.id as string
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [unitId, setUnitId] = useState('')
  const [category, setCategory] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => { fetchReservation(); fetchUnits() }, [reservationId])

  async function fetchReservation() {
    setLoading(true)
    const { data } = await supabase.from('reservations').select(`*, patients (*), units (*)`).eq('id', reservationId).single()
    if (data) { setReservation(data); setStatus(data.status); setUnitId(data.unit_id || ''); setCategory(data.category || ''); setNote(data.note || '') }
    setLoading(false)
  }

  async function fetchUnits() {
    const { data } = await supabase.from('units').select('*').eq('is_active', true).order('unit_number')
    if (data) setUnits(data)
  }

  async function handleSave() {
    setSaving(true)
    await supabase.from('reservations').update({ status, unit_id: unitId || null, category, note, updated_at: new Date().toISOString() }).eq('id', reservationId)
    fetchReservation()
    setSaving(false)
  }

  async function handleCheckIn() {
    await supabase.from('reservations').update({ status: 'checked_in', updated_at: new Date().toISOString() }).eq('id', reservationId)
    if (reservation) await supabase.from('waiting_list').insert({ patient_id: reservation.patient_id, reservation_id: reservationId, assigned_unit_id: unitId || null, status: 'waiting' })
    fetchReservation()
  }

  const categoryLabels: Record<string, string> = { first_visit: '初診', checkup: '定期検診', treatment: '治療', consultation: '相談', emergency: '急患', other: 'その他' }
  const statusLabels: Record<string, string> = { tentative: '仮予約', confirmed: '予約確定', checked_in: '来院済', in_progress: '診察中', completed: '完了', cancelled: 'キャンセル', no_show: '無断キャンセル' }
  const statusColors: Record<string, string> = { tentative: 'bg-gray-100 text-gray-700', confirmed: 'bg-blue-100 text-blue-700', checked_in: 'bg-green-100 text-green-700', in_progress: 'bg-yellow-100 text-yellow-700', completed: 'bg-gray-100 text-gray-700', cancelled: 'bg-red-100 text-red-700', no_show: 'bg-red-100 text-red-700' }

  if (loading) return <div className="p-6 text-center text-gray-500">読み込み中...</div>
  if (!reservation) return <div className="p-6 text-center text-gray-500">予約が見つかりません</div>

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6"><Link href="/calendar" className="text-blue-600 hover:text-blue-800">← カレンダーに戻る</Link></div>
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-xl font-bold text-gray-800">予約詳細</h1>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[reservation.status]}`}>{statusLabels[reservation.status]}</span>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div><h3 className="text-sm font-medium text-gray-500 mb-1">予約日時</h3><p className="text-lg">{format(new Date(reservation.reservation_date + 'T00:00:00'), 'yyyy年M月d日(E)', { locale: ja })} <span className="font-bold">{reservation.start_time?.slice(0, 5)}</span></p></div>
            <div><h3 className="text-sm font-medium text-gray-500 mb-1">種別</h3><select value={category} onChange={(e) => setCategory(e.target.value)} className="border rounded-lg px-3 py-2 w-full">{Object.entries(categoryLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
            <div><h3 className="text-sm font-medium text-gray-500 mb-1">ユニット</h3><select value={unitId} onChange={(e) => setUnitId(e.target.value)} className="border rounded-lg px-3 py-2 w-full"><option value="">指定なし</option>{units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
            <div><h3 className="text-sm font-medium text-gray-500 mb-1">ステータス</h3><select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded-lg px-3 py-2 w-full">{Object.entries(statusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          </div>
          <div className="mt-4"><h3 className="text-sm font-medium text-gray-500 mb-1">備考</h3><textarea value={note} onChange={(e) => setNote(e.target.value)} className="border rounded-lg px-3 py-2 w-full" rows={2} /></div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t"><button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? '保存中...' : '変更を保存'}</button></div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">患者情報</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><h3 className="text-sm font-medium text-gray-500">氏名</h3><p className="text-lg">{reservation.patients?.name_last} {reservation.patients?.name_first}</p></div>
            <div><h3 className="text-sm font-medium text-gray-500">電話番号</h3><p>{reservation.patients?.phone || '-'}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">操作</h2>
          <div className="flex flex-wrap gap-3">
            {reservation.status === 'confirmed' && <button onClick={handleCheckIn} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">✓ 来院確認（チェックイン）</button>}
          </div>
        </div>
      </div>
    </div>
  )
}
