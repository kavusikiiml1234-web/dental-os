'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function CheckinPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // 入力情報
  const [nameLast, setNameLast] = useState('')
  const [nameFirst, setNameFirst] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [phone, setPhone] = useState('')
  
  // 検索結果
  const [foundReservation, setFoundReservation] = useState<any>(null)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      // 患者情報で検索（予約日は問わない）
      const { data: reservations, error: searchError } = await supabase
        .from('reservations')
        .select(`*, patients (*)`)
        .in('status', ['confirmed', 'pending']) // まだチェックインしていない予約
        .order('reservation_date', { ascending: true })
      
      if (searchError) {
        console.error('Search error:', searchError)
        setError('検索中にエラーが発生しました')
        setLoading(false)
        return
      }
      
      // 入力情報でマッチング
      const inputPhone = phone.replace(/-/g, '')
      
      const matched = reservations?.find(r => {
        const p = r.patients
        if (!p) return false
        
        // 名前チェック（姓と名）
        const nameMatch = p.name_last === nameLast && p.name_first === nameFirst
        
        // 生年月日チェック
        const birthMatch = p.birth_date === birthDate
        
        // 電話番号チェック（ハイフン除去して比較）
        const patientPhone = p.phone?.replace(/-/g, '') || ''
        const phoneMatch = patientPhone === inputPhone || 
                          patientPhone.includes(inputPhone) || 
                          inputPhone.includes(patientPhone)
        
        // 名前 + (生年月日 または 電話番号) でマッチ
        return nameMatch && (birthMatch || phoneMatch)
      })
      
      if (!matched) {
        setError('ご予約が見つかりませんでした。\n入力内容をご確認いただくか、受付スタッフにお声がけください。')
        setLoading(false)
        return
      }
      
      // 予約見つかった！
      setFoundReservation(matched)
      setStep(2)
      
    } catch (err) {
      console.error('Error:', err)
      setError('エラーが発生しました')
    }
    
    setLoading(false)
  }

  function handleConfirm() {
    // 保険証アップロード画面へ
    router.push(`/checkin/insurance?reservation_id=${foundReservation.id}&patient_id=${foundReservation.patient_id}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            🏥 チェックイン
          </h1>
          <p className="text-sm text-gray-500">○○歯科クリニック</p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        {/* ステップ1: 本人情報入力 */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">👤</div>
              <h2 className="text-lg font-semibold text-gray-800">
                ご本人確認
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                ご予約時のお名前・生年月日・電話番号を入力してください
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm whitespace-pre-line">
                {error}
              </div>
            )}

            <form onSubmit={handleSearch} className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    姓 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={nameLast}
                    onChange={(e) => setNameLast(e.target.value)}
                    placeholder="山田"
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={nameFirst}
                    onChange={(e) => setNameFirst(e.target.value)}
                    placeholder="太郎"
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  生年月日 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  電話番号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="090-1234-5678"
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-blue-600 text-white rounded-lg font-medium text-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? '検索中...' : '予約を確認する'}
              </button>
            </form>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>予約が見つからない場合</strong><br />
                受付スタッフにお声がけください。
              </p>
            </div>
          </div>
        )}

        {/* ステップ2: 予約確認 */}
        {step === 2 && foundReservation && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">✓</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-800">
                ご予約が確認できました
              </h2>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-gray-600">お名前</dt>
                  <dd className="font-bold text-blue-900">
                    {foundReservation.patients?.name_last} {foundReservation.patients?.name_first} 様
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">予約日</dt>
                  <dd className="font-bold text-blue-900">
                    {foundReservation.reservation_date}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">予約時間</dt>
                  <dd className="font-bold text-blue-900">
                    {foundReservation.start_time?.slice(0, 5)}〜
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">診察内容</dt>
                  <dd className="font-medium">
                    {foundReservation.category === 'first_visit' ? '初診' :
                     foundReservation.category === 'checkup' ? '定期検診' :
                     foundReservation.category === 'treatment' ? '治療' : '診察'}
                  </dd>
                </div>
              </dl>
            </div>

            <p className="text-center text-sm text-gray-600 mb-6">
              上記の内容でよろしければ「次へ進む」を押してください
            </p>

            <button
              onClick={handleConfirm}
              className="w-full py-4 bg-green-600 text-white rounded-lg font-medium text-lg hover:bg-green-700 transition"
            >
              次へ進む（保険証確認）
            </button>

            <button
              onClick={() => { setStep(1); setFoundReservation(null); setError(''); }}
              className="w-full mt-3 py-3 text-gray-600 text-sm"
            >
              ← 入力し直す
            </button>
          </div>
        )}

        {/* 案内 */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            初めての方は受付にてお手続きをお願いいたします
          </p>
        </div>
      </main>
    </div>
  )
}
