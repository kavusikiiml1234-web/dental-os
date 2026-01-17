'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

export default function ChartPage() {
  const params = useParams()
  const patientId = params.id as string
  const [patient, setPatient] = useState<any>(null)
  const [latestInterview, setLatestInterview] = useState<any>(null)
  const [interviews, setInterviews] = useState<any[]>([])
  const [reservations, setReservations] = useState<any[]>([])
  const [medicalRecords, setMedicalRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (patientId) {
      fetchAllData()
    }
  }, [patientId])

  async function fetchAllData() {
    setLoading(true)

    // 患者基本情報
    const { data: patientData } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single()
    if (patientData) setPatient(patientData)

    // 問診履歴（最新順）
    const { data: interviewData } = await supabase
      .from('interviews')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
    if (interviewData && interviewData.length > 0) {
      setLatestInterview(interviewData[0])
      setInterviews(interviewData)
    }

    // 予約履歴
    const { data: reservationData } = await supabase
      .from('reservations')
      .select('*')
      .eq('patient_id', patientId)
      .order('reservation_date', { ascending: false })
      .limit(10)
    if (reservationData) setReservations(reservationData)

    // 診療記録
    const { data: recordData } = await supabase
      .from('medical_records')
      .select('*, staff(name)')
      .eq('patient_id', patientId)
      .order('record_date', { ascending: false })
      .limit(10)
    if (recordData) setMedicalRecords(recordData)

    setLoading(false)
  }

  const genderLabels: Record<string, string> = { male: '男性', female: '女性', other: 'その他' }

  if (loading) return <div className="p-6 text-center text-gray-500">読み込み中...</div>
  if (!patient) return <div className="p-6 text-center text-gray-500">患者が見つかりません</div>

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-6 flex justify-between items-start">
          <div>
            <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm">← ダッシュボードに戻る</Link>
            <h1 className="text-2xl font-bold text-gray-800 mt-2 flex items-center gap-3">
              📋 電子カルテ
            </h1>
          </div>
          <Link
            href={`/reservations/new?patient=${patientId}`}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            ＋ 新規予約
          </Link>
        </div>

        {/* 患者基本情報ヘッダー */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
              👤
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  {patient.name_last} {patient.name_first}
                </h2>
                <span className="text-gray-500">
                  ({patient.name_last_kana} {patient.name_first_kana})
                </span>
              </div>
              <div className="flex gap-6 mt-2 text-sm text-gray-600">
                <span>患者番号: <strong>{patient.patient_number}</strong></span>
                <span>生年月日: <strong>{patient.birth_date || '-'}</strong></span>
                <span>性別: <strong>{genderLabels[patient.gender] || '-'}</strong></span>
                <span>電話: <strong>{patient.phone || '-'}</strong></span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* 左カラム: 問診情報（S情報） */}
          <div className="col-span-2 space-y-6">
            {/* 問診情報 */}
            <div className="bg-white rounded-xl shadow">
              <div className="px-6 py-4 border-b bg-red-50 rounded-t-xl">
                <h3 className="text-lg font-semibold text-red-800 flex items-center gap-2">
                  📝 問診情報（S: 主観的情報）
                </h3>
                {latestInterview && (
                  <p className="text-xs text-red-600 mt-1">
                    最終更新: {format(new Date(latestInterview.created_at), 'yyyy/MM/dd HH:mm')}
                  </p>
                )}
              </div>
              {latestInterview ? (
                <div className="p-6">
                  {/* 主訴 */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">主訴（Chief Complaint）</h4>
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                      <p className="text-lg font-medium text-red-800">{latestInterview.chief_complaint}</p>
                      <div className="flex gap-4 mt-2 text-sm text-red-600">
                        <span>痛みレベル: <strong>{latestInterview.pain_level}/10</strong></span>
                        <span>発症: <strong>{
                          latestInterview.symptom_duration === 'today' ? '今日から' :
                          latestInterview.symptom_duration === 'few_days' ? '2〜3日前から' :
                          latestInterview.symptom_duration === 'week' ? '1週間前から' :
                          latestInterview.symptom_duration === 'month' ? '1ヶ月前から' :
                          latestInterview.symptom_duration === 'more' ? '1ヶ月以上前から' :
                          latestInterview.symptom_duration || '-'
                        }</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    {/* 既往歴 */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">既往歴</h4>
                      <div className="bg-gray-50 p-3 rounded">
                        <p>{
                          latestInterview.medical_history_detail === 'none' ? '特になし' :
                          latestInterview.medical_history_detail?.split(',').map((h: string) => {
                            const labels: Record<string, string> = {
                              hypertension: '高血圧', diabetes: '糖尿病', heart_disease: '心臓病',
                              asthma: '喘息', hepatitis: '肝炎', kidney_disease: '腎臓病', none: '特になし'
                            }
                            return labels[h] || h
                          }).join('、') || '特になし'
                        }</p>
                      </div>
                    </div>

                    {/* アレルギー */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">アレルギー</h4>
                      <div className={`p-3 rounded ${latestInterview.has_allergy ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'}`}>
                        <p className={latestInterview.has_allergy ? 'text-orange-700 font-medium' : ''}>
                          {latestInterview.allergy_detail || 'なし'}
                        </p>
                      </div>
                    </div>

                    {/* 服薬中の薬 */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">服用中の薬</h4>
                      <div className="bg-gray-50 p-3 rounded">
                        <p>{latestInterview.current_medication_detail || 'なし'}</p>
                      </div>
                    </div>

                    {/* その他 */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">その他</h4>
                      <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                        <p>歯科不安: {
                          latestInterview.dental_anxiety_detail === '特にない' ? '特になし' :
                          latestInterview.dental_anxiety_detail || '-'
                        }</p>
                        <p>喫煙: {
                          latestInterview.smoking_status === 'never' ? '吸わない' :
                          latestInterview.smoking_status === 'current' ? '喫煙中' :
                          latestInterview.smoking_status === 'former' ? '過去に喫煙' :
                          latestInterview.smoking_status || '-'
                        }</p>
                        <p>妊娠: {
                          latestInterview.pregnancy_status === 'not_applicable' ? '該当しない' :
                          latestInterview.pregnancy_status === 'not_pregnant' ? 'なし' :
                          latestInterview.pregnancy_status === 'possibly_pregnant' ? '可能性あり' :
                          latestInterview.pregnancy_status === 'pregnant' ? '妊娠中' :
                          latestInterview.pregnancy_status || '-'
                        }</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-gray-400">
                  問診データがありません
                </div>
              )}
            </div>

            {/* 診療記録（SOAP） */}
            <div className="bg-white rounded-xl shadow">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  🩺 診療記録（SOAP）
                </h3>
              </div>
              {medicalRecords.length > 0 ? (
                <div className="divide-y">
                  {medicalRecords.map(record => (
                    <div key={record.id} className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className="text-sm font-medium text-gray-900">
                            {format(new Date(record.record_date), 'yyyy/MM/dd')}
                          </span>
                          <span className="text-sm text-gray-500 ml-3">
                            担当: {record.staff?.name || '-'}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-blue-600">S:</span>
                          <p className="text-gray-700">{record.subjective || '-'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-green-600">O:</span>
                          <p className="text-gray-700">{record.objective || '-'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-orange-600">A:</span>
                          <p className="text-gray-700">{record.assessment || '-'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-purple-600">P:</span>
                          <p className="text-gray-700">{record.plan || '-'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-400">
                  診療記録がありません
                  <p className="text-sm mt-2">（診察時に自動作成されます）</p>
                </div>
              )}
            </div>
          </div>

          {/* 右カラム: 来院履歴・その他 */}
          <div className="space-y-6">
            {/* 来院履歴 */}
            <div className="bg-white rounded-xl shadow">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800">来院履歴</h3>
              </div>
              {reservations.length > 0 ? (
                <div className="divide-y max-h-80 overflow-y-auto">
                  {reservations.map(r => (
                    <div key={r.id} className="px-6 py-3 hover:bg-gray-50">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {format(new Date(r.reservation_date + 'T00:00:00'), 'MM/dd(E)', { locale: ja })}
                          </p>
                          <p className="text-xs text-gray-500">{r.start_time?.slice(0, 5)}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          r.status === 'completed' ? 'bg-gray-100 text-gray-600' :
                          r.status === 'confirmed' ? 'bg-blue-100 text-blue-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {r.status === 'completed' ? '完了' : r.status === 'confirmed' ? '予約中' : r.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-400">
                  来院履歴がありません
                </div>
              )}
            </div>

            {/* 過去の問診 */}
            {interviews.length > 1 && (
              <div className="bg-white rounded-xl shadow">
                <div className="px-6 py-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-800">過去の問診</h3>
                </div>
                <div className="divide-y max-h-60 overflow-y-auto">
                  {interviews.slice(1).map(interview => (
                    <div key={interview.id} className="px-6 py-3">
                      <p className="text-xs text-gray-500">
                        {format(new Date(interview.created_at), 'yyyy/MM/dd')}
                      </p>
                      <p className="text-sm text-gray-700 truncate">{interview.chief_complaint}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* クイックアクション */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">クイックアクション</h3>
              <div className="space-y-2">
                <Link
                  href={`/patients/${patientId}`}
                  className="block w-full text-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  患者詳細を見る
                </Link>
                <Link
                  href={`/reservations/new?patient=${patientId}`}
                  className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  次回予約を取る
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
