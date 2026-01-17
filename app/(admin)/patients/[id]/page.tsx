'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

export default function PatientDetailPage() {
  const params = useParams()
  const patientId = params.id as string
  const [patient, setPatient] = useState<any>(null)
  const [interviews, setInterviews] = useState<any[]>([])
  const [reservations, setReservations] = useState<any[]>([])
  const [insurances, setInsurances] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (patientId) {
      fetchPatientData()
    }
  }, [patientId])

  async function fetchPatientData() {
    setLoading(true)

    // 患者基本情報
    const { data: patientData } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single()
    if (patientData) setPatient(patientData)

    // 問診履歴
    const { data: interviewData } = await supabase
      .from('interviews')
      .select('*, reservations(reservation_date, start_time)')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
    if (interviewData) setInterviews(interviewData)

    // 予約履歴
    const { data: reservationData } = await supabase
      .from('reservations')
      .select('*, units(name)')
      .eq('patient_id', patientId)
      .order('reservation_date', { ascending: false })
      .limit(20)
    if (reservationData) setReservations(reservationData)

    // 保険情報
    const { data: insuranceData } = await supabase
      .from('insurances')
      .select('*')
      .eq('patient_id', patientId)
      .order('valid_from', { ascending: false })
    if (insuranceData) setInsurances(insuranceData)

    setLoading(false)
  }

  const genderLabels: Record<string, string> = { male: '男性', female: '女性', other: 'その他' }
  const categoryLabels: Record<string, string> = { first_visit: '初診', checkup: '定期検診', treatment: '治療', consultation: '相談', emergency: '急患', other: 'その他' }
  const statusLabels: Record<string, string> = { tentative: '仮予約', confirmed: '予約確定', checked_in: '来院済', in_progress: '診察中', completed: '完了', cancelled: 'キャンセル', no_show: '無断キャンセル' }

  if (loading) return <div className="p-6 text-center text-gray-500">読み込み中...</div>
  if (!patient) return <div className="p-6 text-center text-gray-500">患者が見つかりません</div>

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Link href="/patients" className="text-blue-600 hover:text-blue-800">← 患者一覧に戻る</Link>
        </div>

        {/* ヘッダー */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                  👤
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    {patient.name_last} {patient.name_first}
                  </h1>
                  <p className="text-gray-500">
                    {patient.name_last_kana} {patient.name_first_kana}
                  </p>
                  <p className="text-sm text-gray-400">患者番号: {patient.patient_number}</p>
                </div>
              </div>
            </div>
            <Link
              href={`/reservations/new?patient=${patientId}`}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              ＋ 新規予約
            </Link>
          </div>
        </div>

        {/* タブ */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-4">
            {[
              { id: 'overview', label: '概要' },
              { id: 'interview', label: '問診' },
              { id: 'history', label: '来院履歴' },
              { id: 'insurance', label: '保険情報' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-4 border-b-2 font-medium text-sm transition ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* 概要タブ */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 gap-6">
            {/* 基本情報 */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">基本情報</h2>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-gray-500">生年月日</dt>
                  <dd className="font-medium">{patient.birth_date || '-'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">性別</dt>
                  <dd className="font-medium">{genderLabels[patient.gender] || '-'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">電話番号</dt>
                  <dd className="font-medium">{patient.phone || '-'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">メール</dt>
                  <dd className="font-medium text-sm">{patient.email || '-'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">住所</dt>
                  <dd className="font-medium text-sm">{patient.address || '-'}</dd>
                </div>
              </dl>
            </div>

            {/* 最新の問診情報（S情報） */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                最新の問診情報（S情報）
              </h2>
              {interviews.length > 0 ? (
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm text-gray-500">主訴</dt>
                    <dd className="font-medium text-red-600">{interviews[0].chief_complaint}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">痛みレベル</dt>
                    <dd className="font-medium">{interviews[0].pain_level}/10</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">既往歴</dt>
                    <dd className="font-medium">{interviews[0].medical_history || 'なし'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">アレルギー</dt>
                    <dd className="font-medium text-orange-600">{interviews[0].allergies || 'なし'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">服用中の薬</dt>
                    <dd className="font-medium">{interviews[0].current_medications || 'なし'}</dd>
                  </div>
                </dl>
              ) : (
                <p className="text-gray-400">問診データがありません</p>
              )}
            </div>

            {/* 次回予約 */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">次回予約</h2>
              {reservations.filter(r => r.status !== 'completed' && r.status !== 'cancelled').length > 0 ? (
                <div className="space-y-3">
                  {reservations
                    .filter(r => r.status !== 'completed' && r.status !== 'cancelled')
                    .slice(0, 3)
                    .map(r => (
                      <div key={r.id} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <div>
                          <p className="font-medium">
                            {format(new Date(r.reservation_date + 'T00:00:00'), 'M/d(E)', { locale: ja })} {r.start_time?.slice(0, 5)}
                          </p>
                          <p className="text-sm text-gray-600">{categoryLabels[r.category]}</p>
                        </div>
                        <Link href={`/reservations/${r.id}`} className="text-blue-600 text-sm hover:underline">
                          詳細
                        </Link>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-400">予約なし</p>
              )}
            </div>

            {/* 保険情報 */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">保険情報</h2>
              {insurances.length > 0 ? (
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">保険者番号</dt>
                    <dd className="font-medium">{insurances[0].insurer_number || '-'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">被保険者番号</dt>
                    <dd className="font-medium">{insurances[0].insured_number || '-'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">負担割合</dt>
                    <dd className="font-medium">{insurances[0].copay_rate ? `${insurances[0].copay_rate}割` : '-'}</dd>
                  </div>
                </dl>
              ) : (
                <p className="text-gray-400">保険情報が登録されていません</p>
              )}
            </div>
          </div>
        )}

        {/* 問診タブ */}
        {activeTab === 'interview' && (
          <div className="bg-white rounded-xl shadow">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">問診履歴</h2>
            </div>
            {interviews.length === 0 ? (
              <div className="p-6 text-center text-gray-500">問診データがありません</div>
            ) : (
              <div className="divide-y">
                {interviews.map((interview, index) => (
                  <div key={interview.id} className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-sm text-gray-500">
                          {format(new Date(interview.created_at), 'yyyy/MM/dd HH:mm')}
                        </span>
                        {index === 0 && (
                          <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">最新</span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">主訴</h4>
                        <p className="text-red-600 font-medium">{interview.chief_complaint}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">痛みレベル</h4>
                        <p>{interview.pain_level}/10</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">既往歴</h4>
                        <p>{interview.medical_history || 'なし'}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">アレルギー</h4>
                        <p className="text-orange-600">{interview.allergies || 'なし'}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">服用中の薬</h4>
                        <p>{interview.current_medications || 'なし'}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">歯科不安</h4>
                        <p>{interview.dental_anxiety || '-'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 来院履歴タブ */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">来院履歴</h2>
            </div>
            {reservations.length === 0 ? (
              <div className="p-6 text-center text-gray-500">来院履歴がありません</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">日付</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">時間</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">種別</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ステータス</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reservations.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {format(new Date(r.reservation_date + 'T00:00:00'), 'yyyy/MM/dd(E)', { locale: ja })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{r.start_time?.slice(0, 5)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{categoryLabels[r.category] || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{statusLabels[r.status]}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link href={`/reservations/${r.id}`} className="text-blue-600 hover:underline">詳細</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* 保険情報タブ */}
        {activeTab === 'insurance' && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">保険情報</h2>
            {insurances.length === 0 ? (
              <p className="text-gray-500">保険情報が登録されていません。チェックイン時に保険証をアップロードすると自動登録されます。</p>
            ) : (
              <div className="space-y-4">
                {insurances.map((ins, index) => (
                  <div key={ins.id} className={`p-4 rounded-lg ${index === 0 ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50'}`}>
                    {index === 0 && <span className="text-xs text-blue-600 font-medium">現在有効</span>}
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <p className="text-sm text-gray-500">保険者番号</p>
                        <p className="font-medium">{ins.insurer_number || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">被保険者番号</p>
                        <p className="font-medium">{ins.insured_number || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">負担割合</p>
                        <p className="font-medium">{ins.copay_rate ? `${ins.copay_rate}割` : '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">有効期間</p>
                        <p className="font-medium">{ins.valid_from} 〜 {ins.valid_until || '現在'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
