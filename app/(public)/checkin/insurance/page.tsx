'use client'

import { useState, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function InsuranceContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const reservationId = searchParams.get('reservation_id')
  const patientId = searchParams.get('patient_id')
  
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [frontImage, setFrontImage] = useState<string | null>(null)
  const [backImage, setBackImage] = useState<string | null>(null)
  const [hasInsurance, setHasInsurance] = useState<boolean | null>(null)
  
  const frontInputRef = useRef<HTMLInputElement>(null)
  const backInputRef = useRef<HTMLInputElement>(null)

  function handleImageCapture(e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      if (side === 'front') {
        setFrontImage(base64)
      } else {
        setBackImage(base64)
      }
    }
    reader.readAsDataURL(file)
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError('')
    
    try {
      let ocrData: any = {}
      
      // AI OCRで保険証を読み取り
      if (hasInsurance && frontImage) {
        setStatus('🤖 AIが保険証を読み取り中...')
        
        try {
          const ocrResponse = await fetch('/api/ocr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: frontImage }),
          })
          
          const ocrResult = await ocrResponse.json()
          
          if (ocrResult.success && ocrResult.data) {
            ocrData = ocrResult.data
            setStatus('✅ 保険証の読み取り完了！保存中...')
          } else {
            console.log('OCR failed, saving image only:', ocrResult.error)
            setStatus('📷 画像を保存中...')
          }
        } catch (ocrError) {
          console.error('OCR error:', ocrError)
          setStatus('📷 画像を保存中...')
        }
        
        // 既存の保険情報があるか確認
        const { data: existingInsurance } = await supabase
          .from('insurances')
          .select('id')
          .eq('patient_id', patientId)
          .single()
        
        const insuranceData = {
          patient_id: patientId,
          insurance_card_front: frontImage,
          insurance_card_back: backImage,
          verified_at: new Date().toISOString(),
          is_verified: false,
          // OCRで読み取った情報
          insurer_number: ocrData.insurer_number || null,
          insurer_name: ocrData.insurer_name || null,
          symbol: ocrData.symbol || null,
          insured_number: ocrData.insured_number || null,
          insured_name: ocrData.insured_name || null,
          relationship: ocrData.relationship || null,
          copay_rate: ocrData.copay_rate ? parseInt(ocrData.copay_rate) : null,
          valid_from: ocrData.valid_from || null,
          valid_until: ocrData.valid_until || null,
        }
        
        if (existingInsurance) {
          // 更新
          const { error: insuranceError } = await supabase
            .from('insurances')
            .update(insuranceData)
            .eq('id', existingInsurance.id)
          
          if (insuranceError) {
            console.error('Insurance update error:', insuranceError)
          }
        } else {
          // 新規作成
          const { error: insuranceError } = await supabase
            .from('insurances')
            .insert(insuranceData)
          
          if (insuranceError) {
            console.error('Insurance insert error:', insuranceError)
          }
        }
      }
      
      setStatus('チェックイン処理中...')
      
      // 予約ステータスを「来院済み」に更新
      const { error: updateError } = await supabase
        .from('reservations')
        .update({ 
          status: 'checked_in',
          checked_in_at: new Date().toISOString()
        })
        .eq('id', reservationId)
      
      if (updateError) {
        console.error('Checkin error:', updateError)
        setError('チェックインに失敗しました。受付にお声がけください。')
        setSubmitting(false)
        return
      }
      
      // 完了画面へ
      router.push(`/checkin/complete?reservation_id=${reservationId}`)
      
    } catch (err: any) {
      console.error('Submit error:', err)
      setError('エラーが発生しました。受付にお声がけください。')
      setSubmitting(false)
    }
  }

  async function handleSkipInsurance() {
    setHasInsurance(false)
    setSubmitting(true)
    
    // 保険証なしでチェックイン
    const { error: updateError } = await supabase
      .from('reservations')
      .update({ 
        status: 'checked_in',
        checked_in_at: new Date().toISOString()
      })
      .eq('id', reservationId)
    
    if (updateError) {
      setError('チェックインに失敗しました。')
      setSubmitting(false)
      return
    }
    
    router.push(`/checkin/complete?reservation_id=${reservationId}&no_insurance=true`)
  }

  // まず保険証の有無を確認
  if (hasInsurance === null) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <header className="bg-white shadow-sm">
          <div className="max-w-lg mx-auto px-4 py-4">
            <h1 className="text-xl font-bold text-gray-800">🏥 チェックイン</h1>
            <p className="text-sm text-gray-500">保険証確認</p>
          </div>
        </header>

        <main className="max-w-lg mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">💳</div>
              <h2 className="text-lg font-semibold text-gray-800">
                健康保険証をお持ちですか？
              </h2>
              <p className="text-sm text-gray-500 mt-2">
                初診の方・月初めの方は保険証の確認が必要です
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => setHasInsurance(true)}
                className="w-full py-4 bg-blue-600 text-white rounded-lg font-medium text-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                📷 保険証を撮影する
              </button>
              
              <button
                onClick={handleSkipInsurance}
                className="w-full py-4 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                保険証の確認をスキップ
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center mt-6">
              ※保険証をスキップした場合、受付で確認させていただきます
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="bg-white shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-800">🏥 チェックイン</h1>
          <p className="text-sm text-gray-500">保険証撮影</p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">
            保険証を撮影してください
          </h2>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* 表面 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                保険証（表面）<span className="text-red-500">*</span>
              </label>
              <input
                ref={frontInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => handleImageCapture(e, 'front')}
                className="hidden"
              />
              {frontImage ? (
                <div className="relative">
                  <img 
                    src={frontImage} 
                    alt="保険証表面" 
                    className="w-full rounded-lg border"
                  />
                  <button
                    onClick={() => frontInputRef.current?.click()}
                    className="absolute bottom-2 right-2 px-3 py-1 bg-white/90 rounded-lg text-sm text-blue-600"
                  >
                    撮り直す
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => frontInputRef.current?.click()}
                  className="w-full aspect-[1.6/1] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-blue-400 transition"
                >
                  <span className="text-4xl">📷</span>
                  <span className="text-gray-600">タップして撮影</span>
                </button>
              )}
            </div>

            {/* 裏面 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                保険証（裏面）<span className="text-gray-400">（任意）</span>
              </label>
              <input
                ref={backInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => handleImageCapture(e, 'back')}
                className="hidden"
              />
              {backImage ? (
                <div className="relative">
                  <img 
                    src={backImage} 
                    alt="保険証裏面" 
                    className="w-full rounded-lg border"
                  />
                  <button
                    onClick={() => backInputRef.current?.click()}
                    className="absolute bottom-2 right-2 px-3 py-1 bg-white/90 rounded-lg text-sm text-blue-600"
                  >
                    撮り直す
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => backInputRef.current?.click()}
                  className="w-full aspect-[1.6/1] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-blue-400 transition"
                >
                  <span className="text-4xl">📷</span>
                  <span className="text-gray-600">タップして撮影</span>
                </button>
              )}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!frontImage || submitting}
            className="w-full mt-6 py-4 bg-green-600 text-white rounded-lg font-medium text-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (status || 'チェックイン中...') : 'チェックインを完了する'}
          </button>

          <button
            onClick={() => setHasInsurance(null)}
            className="w-full mt-3 py-3 text-gray-600 text-sm"
          >
            ← 戻る
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
          撮影した画像は保険確認のみに使用し、安全に管理されます
        </p>
      </main>
    </div>
  )
}

export default function InsurancePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">読み込み中...</div>}>
      <InsuranceContent />
    </Suspense>
  )
}
