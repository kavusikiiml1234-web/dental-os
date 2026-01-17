'use client'

import { useState, useEffect, Suspense } from 'react'
import { supabase, Patient, Unit } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'

function NewReservationForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [units, setUnits] = useState<Unit[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [isNewPatient, setIsNewPatient] = useState(false)
  const [nameLast, setNameLast] = useState('')
  const [nameFirst, setNameFirst] = useState('')
  const [nameLastKana, setNameLastKana] = useState('')
  const [nameFirstKana, setNameFirstKana] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender] = useState('male')
  const [phone, setPhone] = useState('')
  const [reservationDate, setReservationDate] = useState(searchParams.get('date') || format(new Date(), 'yyyy-MM-dd'))
  const [startTime, setStartTime] = useState(searchParams.get('time') || '')
  const [unitId, setUnitId] = useState(searchParams.get('unit') || '')
  const [category, setCategory] = useState('treatment')
  const [note, setNote] = useState('')

  const timeOptions = Array.from({ length: 20 }, (_, i) => {
    const hour = Math.floor(i / 2) + 9
    const minute = (i % 2) * 30
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  })

  useEffect(() => { fetchUnits() }, [])

  async function fetchUnits() {
    const { data } = await supabase.from('units').select('*').eq('is_active', true).order('unit_number')
    if (data) { setUnits(data); if (!unitId && data.length > 0) setUnitId(data[0].id) }
  }

  async function searchPatients(query: string) {
    if (query.length < 2) { setSearchResults([]); return }
    const { data } = await supabase.from('patients').select('*').or(`phone.ilike.%${query}%,name_last.ilike.%${query}%,name_first.ilike.%${query}%`).limit(10)
    if (data) setSearchResults(data)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      let patientId: string
      if (selectedPatient) {
        patientId = selectedPatient.id
      } else if (isNewPatient) {
        const { data: newPatient, error: patientError } = await supabase.from('patients').insert({ name_last: nameLast, name_first: nameFirst, name_last_kana: nameLastKana, name_first_kana: nameFirstKana, birth_date: birthDate || null, gender: gender, phone: phone }).select('id').single()
        if (patientError) throw patientError
        patientId = newPatient.id
      } else {
        throw new Error('患者を選択または新規登録してください')
      }
      const { error: reservationError } = await supabase.from('reservations').insert({ patient_id: patientId, unit_id: unitId || null, reservation_date: reservationDate, start_time: startTime, category: category, status: 'confirmed', source: 'manual', note: note })
      if (reservationError) throw reservationError
      router.push('/calendar')
    } catch (err: any) {
      setError(err.message || '予約の登録に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6"><Link href="/calendar" className="text-blue-600 hover:text-blue-800">← カレンダーに戻る</Link></div>
        <div className="bg-white rounded-xl shadow p-6">
          <h1 className="text-xl font-bold text-gray-800 mb-6">新規予約</h1>
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">患者選択</h2>
              {!selectedPatient && !isNewPatient && (
                <div>
                  <input type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); searchPatients(e.target.value) }} placeholder="電話番号または名前で検索..." className="w-full border rounded-lg px-4 py-3 text-lg" autoFocus />
                  {searchResults.length > 0 && (
                    <div className="mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {searchResults.map(patient => (
                        <div key={patient.id} onClick={() => { setSelectedPatient(patient); setSearchQuery(''); setSearchResults([]) }} className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b">
                          <div className="font-medium">{patient.name_last} {patient.name_first}</div>
                          <div className="text-sm text-gray-500">{patient.phone}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <button type="button" onClick={() => setIsNewPatient(true)} className="mt-3 text-blue-600 hover:underline">＋ 新規患者として登録</button>
                </div>
              )}
              {selectedPatient && (
                <div className="bg-blue-50 p-4 rounded-lg flex justify-between items-start">
                  <div><div className="text-lg font-medium">{selectedPatient.name_last} {selectedPatient.name_first}</div><div className="text-sm text-gray-600">{selectedPatient.phone}</div></div>
                  <button type="button" onClick={() => setSelectedPatient(null)} className="text-gray-500 hover:text-gray-700">変更</button>
                </div>
              )}
              {isNewPatient && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-4"><span className="font-medium text-gray-700">新規患者情報</span><button type="button" onClick={() => setIsNewPatient(false)} className="text-gray-500 text-sm">キャンセル</button></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">姓 *</label><input type="text" value={nameLast} onChange={(e) => setNameLast(e.target.value)} required={isNewPatient} className="w-full border rounded-lg px-3 py-2" placeholder="山田" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">名 *</label><input type="text" value={nameFirst} onChange={(e) => setNameFirst(e.target.value)} required={isNewPatient} className="w-full border rounded-lg px-3 py-2" placeholder="太郎" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">セイ</label><input type="text" value={nameLastKana} onChange={(e) => setNameLastKana(e.target.value)} className="w-full border rounded-lg px-3 py-2" placeholder="ヤマダ" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">メイ</label><input type="text" value={nameFirstKana} onChange={(e) => setNameFirstKana(e.target.value)} className="w-full border rounded-lg px-3 py-2" placeholder="タロウ" /></div>
                    <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">電話番号 *</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required={isNewPatient} className="w-full border rounded-lg px-3 py-2" placeholder="090-1234-5678" /></div>
                  </div>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-4">予約情報</h2>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">予約日 *</label><input type="date" value={reservationDate} onChange={(e) => setReservationDate(e.target.value)} required className="w-full border rounded-lg px-3 py-2" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">時間 *</label><select value={startTime} onChange={(e) => setStartTime(e.target.value)} required className="w-full border rounded-lg px-3 py-2"><option value="">選択</option>{timeOptions.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">ユニット</label><select value={unitId} onChange={(e) => setUnitId(e.target.value)} className="w-full border rounded-lg px-3 py-2"><option value="">指定なし</option>{units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">種別</label><select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border rounded-lg px-3 py-2"><option value="first_visit">初診</option><option value="checkup">定期検診</option><option value="treatment">治療</option><option value="consultation">相談</option><option value="emergency">急患</option></select></div>
              </div>
              <div className="mt-4"><label className="block text-sm font-medium text-gray-700 mb-1">備考</label><textarea value={note} onChange={(e) => setNote(e.target.value)} className="w-full border rounded-lg px-3 py-2" rows={2} /></div>
            </div>
            <div className="flex justify-end gap-4 pt-4 border-t">
              <Link href="/calendar" className="px-6 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">キャンセル</Link>
              <button type="submit" disabled={loading || (!selectedPatient && !isNewPatient)} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{loading ? '登録中...' : '予約を登録'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function NewReservation() {
  return <Suspense fallback={<div className="p-6 text-center">読み込み中...</div>}><NewReservationForm /></Suspense>
}
