'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

function BookingConfirmContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const date = searchParams.get('date') || ''
  const time = searchParams.get('time') || ''
  const nameLast = searchParams.get('nameLast') || ''
  const nameFirst = searchParams.get('nameFirst') || ''
  const nameLastKana = searchParams.get('nameLastKana') || ''
  const nameFirstKana = searchParams.get('nameFirstKana') || ''
  const birthDate = searchParams.get('birthDate') || ''
  const gender = searchParams.get('gender') || ''
  const phone = searchParams.get('phone') || ''
  const email = searchParams.get('email') || ''
  const category = searchParams.get('category') || ''
  const note = searchParams.get('note') || ''

  const categoryLabels: {[key: string]: string} = {
    first_visit: '初診',
    checkup: '定期検診',
    treatment: '治療',
    consultation: '相談',
    emergency: '急患・痛みがある',
    other: 'その他'
  }

  const genderLabels: {[key: string]: string} = {
    male: '男性',
    female: '女性',
    other: 'その他'
  }

  async function handleConfirm() {
    setLoading(true)
    setError('')

    try {
      // 1. 電話番号で既存患者を検索
      const { data: existingPatient } = await supabase
        .from('patients')
        .select('id')
        .eq('phone', phone)
        .single()

      let patientId: string

      if (existingPatient) {
        // 既存患者
        patientId = existingPatient.id
      } else {
        // 新規患者を登録（電子カルテの「箱」を作成）
        const { data: newPatient, error: patientError } = await supabase
          .from('patients')
          .insert({
            name_last: nameLast,
            name_first: nameFirst,
            name_last_kana: nameLastKana || null,
            name_first_kana: nameFirstKana || null,
            birth_date: birthDate || null,
            gender: gender || null,
            phone: phone,
            email: email || null,
          })
          .select('id')
          .single()

        if (patientError) throw patientError
        patientId = newPatient.id
      }

      // 2. 予約を登録
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .insert({
          patient_id: patientId,
          reservation_date: date,
          start_time: time,
          category: category,
          status: 'confirmed',
          source: 'web', // Web予約からの登録
          interview_completed: false, // 問診はまだ
          note: note || null,
        })
        .select('id')
        .single()

      if (reservationError) throw reservationError

      // 3. 完了画面へ遷移
      router.push(`/booking/complete?reservation_id=${reservation.id}&patient_id=${patientId}`)

    } catch (err: any) {
      console.error('Error:', err)
      setError('予約の登録に失敗しました。もう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            🦷 〇〇歯科クリニック
          </h1>
          <p className="text-gray-600 mt-1">Web予約</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* ステップ表示 */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="flex items-center">
            <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">✓</span>
            <span className="ml-2 text-sm text-green-600">日時選択</span>
          </div>
          <div className="w-8 h-px bg-green-500"></div>
          <div className="flex items-center">
            <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">✓</span>
            <span className="ml-2 text-sm text-green-600">情報入力</span>
          </div>
          <div className="w-8 h-px bg-green-500"></div>
          <div className="flex items-center">
            <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
            <span className="ml-2 text-sm font-medium text-blue-600">確認</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* 確認内容 */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">ご予約内容の確認</h2>

          <div className="space-y-4">
            {/* 予約日時 */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 mb-2">ご予約日時</h3>
              <p className="text-xl font-bold text-blue-900">
                {date && format(new Date(date + 'T00:00:00'), 'yyyy年M月d日(E)', { locale: ja })}
              </p>
              <p className="text-xl font-bold text-blue-900">{time}〜</p>
            </div>

            {/* 患者情報 */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-500 mb-3">患者情報</h3>
              <dl className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-xs text-gray-500">お名前</dt>
                  <dd className="font-medium">{nameLast} {nameFirst}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">フリガナ</dt>
                  <dd className="font-medium">{nameLastKana} {nameFirstKana}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">生年月日</dt>
                  <dd className="font-medium">{birthDate || '未入力'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">性別</dt>
                  <dd className="font-medium">{genderLabels[gender] || '未入力'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">電話番号</dt>
                  <dd className="font-medium">{phone}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">メールアドレス</dt>
                  <dd className="font-medium">{email || '未入力'}</dd>
                </div>
              </dl>
            </div>

            {/* 診療内容 */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-500 mb-3">診療内容</h3>
              <p className="font-medium">{categoryLabels[category]}</p>
              {note && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500">ご要望・症状</p>
                  <p className="text-sm">{note}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ボタン */}
        <div className="flex gap-4">
          <button
            onClick={() => window.history.back()}
            className="flex-1 text-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            修正する
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '予約中...' : '予約を確定する'}
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          「予約を確定する」をクリックすると予約が完了します
        </p>
      </main>
    </div>
  )
}

export default function BookingConfirmPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">読み込み中...</div>}>
      <BookingConfirmContent />
    </Suspense>
  )
}
