'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

function InterviewFormContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const reservationId = searchParams.get('reservation_id')
  const patientId = searchParams.get('patient_id')

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [currentStep, setCurrentStep] = useState(1)
  const [patient, setPatient] = useState<any>(null)

  // 問診データ
  const [chiefComplaint, setChiefComplaint] = useState('') // 主訴
  const [symptomDuration, setSymptomDuration] = useState('') // 症状期間
  const [painLevel, setPainLevel] = useState(0) // 痛みレベル (0-10)
  const [painType, setPainType] = useState<string[]>([]) // 痛みの種類
  const [medicalHistory, setMedicalHistory] = useState<string[]>([]) // 既往歴
  const [currentMedications, setCurrentMedications] = useState('') // 服薬
  const [allergies, setAllergies] = useState('') // アレルギー
  const [dentalAnxiety, setDentalAnxiety] = useState('') // 歯科不安
  const [smokingStatus, setSmokingStatus] = useState('') // 喫煙
  const [pregnancyStatus, setPregnancyStatus] = useState('') // 妊娠

  useEffect(() => {
    if (patientId) {
      fetchPatient()
    }
  }, [patientId])

  async function fetchPatient() {
    setLoading(true)
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single()

    if (!error && data) {
      setPatient(data)
    }
    setLoading(false)
  }

  const painTypes = [
    { value: 'constant', label: '常に痛い' },
    { value: 'intermittent', label: '時々痛い' },
    { value: 'when_eating', label: '噛むと痛い' },
    { value: 'hot_cold', label: '熱い・冷たいものがしみる' },
    { value: 'sweet', label: '甘いものがしみる' },
    { value: 'night', label: '夜間に痛む' },
  ]

  const medicalHistoryOptions = [
    { value: 'hypertension', label: '高血圧' },
    { value: 'diabetes', label: '糖尿病' },
    { value: 'heart_disease', label: '心臓病' },
    { value: 'asthma', label: '喘息' },
    { value: 'hepatitis', label: '肝炎' },
    { value: 'kidney_disease', label: '腎臓病' },
    { value: 'stroke', label: '脳卒中' },
    { value: 'cancer', label: 'がん' },
    { value: 'none', label: '特になし' },
  ]

  function togglePainType(value: string) {
    setPainType(prev => 
      prev.includes(value) 
        ? prev.filter(v => v !== value)
        : [...prev, value]
    )
  }

  function toggleMedicalHistory(value: string) {
    if (value === 'none') {
      setMedicalHistory(['none'])
    } else {
      setMedicalHistory(prev => {
        const filtered = prev.filter(v => v !== 'none')
        return filtered.includes(value)
          ? filtered.filter(v => v !== value)
          : [...filtered, value]
      })
    }
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError('')

    try {
      // 1. 問診データを保存
      const { error: interviewError } = await supabase
        .from('interviews')
        .insert({
          patient_id: patientId,
          reservation_id: reservationId,
          chief_complaint: chiefComplaint,
          symptom_duration: symptomDuration,
          pain_level: painLevel,
          medical_history: medicalHistory.join(','),
          current_medications: currentMedications || null,
          allergies: allergies || null,
          dental_anxiety: dentalAnxiety,
          lifestyle_smoking: smokingStatus === 'yes',
          pregnancy_status: pregnancyStatus,
        })

      if (interviewError) throw interviewError

      // 2. 予約の問診完了フラグを更新
      const { error: reservationError } = await supabase
        .from('reservations')
        .update({ interview_completed: true })
        .eq('id', reservationId)

      if (reservationError) throw reservationError

      // 3. 完了画面へ
      router.push(`/interview/complete?reservation_id=${reservationId}`)

    } catch (err: any) {
      console.error('Error:', err)
      setError('送信に失敗しました。もう一度お試しください。')
    } finally {
      setSubmitting(false)
    }
  }

  const totalSteps = 4

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        読み込み中...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            🦷 〇〇歯科クリニック
          </h1>
          <p className="text-gray-600 mt-1">WEB問診</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* プログレスバー */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>進捗</span>
            <span>{currentStep} / {totalSteps}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full">
            <div 
              className="h-2 bg-blue-600 rounded-full transition-all"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        {patient && (
          <div className="bg-blue-50 rounded-lg p-3 mb-6 text-sm">
            <span className="text-blue-800">{patient.name_last} {patient.name_first} 様の問診</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Step 1: 主訴 */}
        {currentStep === 1 && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">
              今日はどのような症状でいらっしゃいましたか？
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  症状を教えてください <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3"
                  rows={4}
                  placeholder="例：右上の奥歯が痛い、歯茎から血が出る、など"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  いつ頃から気になりますか？
                </label>
                <select
                  value={symptomDuration}
                  onChange={(e) => setSymptomDuration(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3"
                >
                  <option value="">選択してください</option>
                  <option value="today">今日から</option>
                  <option value="few_days">2〜3日前から</option>
                  <option value="week">1週間前から</option>
                  <option value="two_weeks">2週間前から</option>
                  <option value="month">1ヶ月前から</option>
                  <option value="more">1ヶ月以上前から</option>
                </select>
              </div>

              {/* 痛みレベル */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  痛みの程度（0: なし 〜 10: 最大）
                </label>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">なし</span>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={painLevel}
                    onChange={(e) => setPainLevel(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-500">最大</span>
                  <span className="w-8 text-center font-bold text-blue-600">{painLevel}</span>
                </div>
              </div>

              {/* 痛みの種類 */}
              {painLevel > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    痛みの特徴（複数選択可）
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {painTypes.map(type => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => togglePainType(type.value)}
                        className={`p-3 rounded-lg text-sm text-left border transition ${
                          painType.includes(type.value)
                            ? 'bg-blue-50 border-blue-500 text-blue-700'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {painType.includes(type.value) ? '✓ ' : ''}{type.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setCurrentStep(2)}
                disabled={!chiefComplaint}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                次へ →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: 既往歴 */}
        {currentStep === 2 && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">
              現在治療中の病気や、過去にかかった病気はありますか？
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  該当するものを選択してください（複数選択可）
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {medicalHistoryOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggleMedicalHistory(option.value)}
                      className={`p-3 rounded-lg text-sm text-left border transition ${
                        medicalHistory.includes(option.value)
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {medicalHistory.includes(option.value) ? '✓ ' : ''}{option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  現在服用中のお薬があれば教えてください
                </label>
                <textarea
                  value={currentMedications}
                  onChange={(e) => setCurrentMedications(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3"
                  rows={3}
                  placeholder="例：血圧の薬、血液をサラサラにする薬、など"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  薬や食べ物でアレルギーはありますか？
                </label>
                <textarea
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3"
                  rows={2}
                  placeholder="例：ペニシリン、ラテックス、卵、など（特になければ「なし」と入力）"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                ← 戻る
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
              >
                次へ →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: 生活習慣・その他 */}
        {currentStep === 3 && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">
              その他の情報をお聞かせください
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  歯科治療に不安はありますか？
                </label>
                <div className="flex gap-2">
                  {['特にない', '少し不安', 'とても不安'].map(option => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setDentalAnxiety(option)}
                      className={`flex-1 p-3 rounded-lg text-sm border transition ${
                        dentalAnxiety === option
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  喫煙について
                </label>
                <div className="flex gap-2">
                  {[
                    { value: 'no', label: '吸わない' },
                    { value: 'yes', label: '吸う' },
                    { value: 'quit', label: '以前吸っていた' },
                  ].map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSmokingStatus(option.value)}
                      className={`flex-1 p-3 rounded-lg text-sm border transition ${
                        smokingStatus === option.value
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  妊娠の可能性について（女性の方）
                </label>
                <div className="flex gap-2">
                  {[
                    { value: 'no', label: 'なし' },
                    { value: 'possible', label: '可能性あり' },
                    { value: 'yes', label: '妊娠中' },
                    { value: 'na', label: '該当しない' },
                  ].map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPregnancyStatus(option.value)}
                      className={`flex-1 p-3 rounded-lg text-sm border transition ${
                        pregnancyStatus === option.value
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                ← 戻る
              </button>
              <button
                onClick={() => setCurrentStep(4)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
              >
                確認画面へ →
              </button>
            </div>
          </div>
        )}

        {/* Step 4: 確認 */}
        {currentStep === 4 && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">
              入力内容の確認
            </h2>

            <div className="space-y-4">
              <div className="border-b pb-4">
                <h3 className="text-sm font-medium text-gray-500 mb-1">主訴</h3>
                <p>{chiefComplaint}</p>
                {symptomDuration && (
                  <p className="text-sm text-gray-600">症状期間: {symptomDuration}</p>
                )}
                <p className="text-sm text-gray-600">痛みレベル: {painLevel}/10</p>
              </div>

              <div className="border-b pb-4">
                <h3 className="text-sm font-medium text-gray-500 mb-1">既往歴</h3>
                <p>{medicalHistory.length > 0 ? medicalHistory.join(', ') : '特になし'}</p>
              </div>

              {currentMedications && (
                <div className="border-b pb-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">服薬中の薬</h3>
                  <p>{currentMedications}</p>
                </div>
              )}

              {allergies && (
                <div className="border-b pb-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">アレルギー</h3>
                  <p>{allergies}</p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">その他</h3>
                <p className="text-sm">歯科不安: {dentalAnxiety || '未回答'}</p>
                <p className="text-sm">喫煙: {smokingStatus || '未回答'}</p>
                <p className="text-sm">妊娠: {pregnancyStatus || '未回答'}</p>
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setCurrentStep(3)}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                ← 戻る
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition"
              >
                {submitting ? '送信中...' : '問診を送信する'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default function InterviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">読み込み中...</div>}>
      <InterviewFormContent />
    </Suspense>
  )
}
