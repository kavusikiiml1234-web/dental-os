'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const DB_COLUMNS = [
  { key: 'patient_number', label: '患者番号', required: false },
  { key: 'name_last', label: '姓', required: true },
  { key: 'name_first', label: '名', required: true },
  { key: 'name_last_kana', label: 'セイ（カナ）', required: false },
  { key: 'name_first_kana', label: 'メイ（カナ）', required: false },
  { key: 'phone', label: '電話番号', required: false },
  { key: 'email', label: 'メール', required: false },
  { key: 'birth_date', label: '生年月日', required: false },
  { key: 'gender', label: '性別', required: false },
  { key: 'address', label: '住所', required: false },
]

export default function PatientImportPage() {
  const [step, setStep] = useState(1)
  const [file, setFile] = useState<File | null>(null)
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvData, setCsvData] = useState<string[][]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    
    setFile(selectedFile)
    setResult(null)
    
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const lines = text.split('\n').filter(line => line.trim())
      
      // ヘッダー行を取得
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
      setCsvHeaders(headers)
      
      // データ行を取得（最初の10行だけプレビュー）
      const data = lines.slice(1, 11).map(line => 
        line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
      )
      setCsvData(data)
      
      // 自動マッピング推測
      const autoMapping: Record<string, string> = {}
      headers.forEach(header => {
        const lowerHeader = header.toLowerCase()
        if (lowerHeader.includes('患者番号') || lowerHeader.includes('診察券') || lowerHeader === 'patient_number') {
          autoMapping['patient_number'] = header
        } else if (lowerHeader === '姓' || lowerHeader === 'name_last' || lowerHeader.includes('患者氏名')) {
          autoMapping['name_last'] = header
        } else if (lowerHeader === '名' || lowerHeader === 'name_first') {
          autoMapping['name_first'] = header
        } else if (lowerHeader.includes('セイ') || lowerHeader === 'name_last_kana' || lowerHeader.includes('フリガナ')) {
          autoMapping['name_last_kana'] = header
        } else if (lowerHeader.includes('メイ') || lowerHeader === 'name_first_kana') {
          autoMapping['name_first_kana'] = header
        } else if (lowerHeader.includes('電話') || lowerHeader.includes('携帯') || lowerHeader === 'phone') {
          autoMapping['phone'] = header
        } else if (lowerHeader.includes('メール') || lowerHeader === 'email') {
          autoMapping['email'] = header
        } else if (lowerHeader.includes('生年月日') || lowerHeader === 'birth_date') {
          autoMapping['birth_date'] = header
        } else if (lowerHeader.includes('性別') || lowerHeader === 'gender') {
          autoMapping['gender'] = header
        } else if (lowerHeader.includes('住所') || lowerHeader === 'address') {
          autoMapping['address'] = header
        }
      })
      setMapping(autoMapping)
      setStep(2)
    }
    reader.readAsText(selectedFile, 'UTF-8')
  }

  function handleMappingChange(dbColumn: string, csvColumn: string) {
    setMapping(prev => ({ ...prev, [dbColumn]: csvColumn }))
  }

  async function handleImport() {
    if (!file) return
    
    setImporting(true)
    setResult(null)
    
    const reader = new FileReader()
    reader.onload = async (event) => {
      const text = event.target?.result as string
      const lines = text.split('\n').filter(line => line.trim())
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
      
      let successCount = 0
      const errors: string[] = []
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
        const row: Record<string, string> = {}
        headers.forEach((h, idx) => { row[h] = values[idx] || '' })
        
        try {
          const patientData: any = { is_active: true }
          
          // マッピングに従ってデータを変換
          DB_COLUMNS.forEach(col => {
            const csvCol = mapping[col.key]
            if (csvCol && row[csvCol]) {
              let value = row[csvCol]
              
              // 特殊変換
              if (col.key === 'gender') {
                if (value === '1' || value === '男' || value === '男性') value = 'male'
                else if (value === '2' || value === '女' || value === '女性') value = 'female'
              }
              
              if (col.key === 'birth_date') {
                // YYYYMMDD形式をYYYY-MM-DD形式に変換
                if (/^\d{8}$/.test(value)) {
                  value = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`
                }
              }
              
              // 氏名が「姓 名」形式で一つのカラムの場合
              if (col.key === 'name_last' && value.includes(' ')) {
                const parts = value.split(' ')
                patientData['name_last'] = parts[0]
                patientData['name_first'] = parts[1] || ''
              } else if (col.key === 'name_last_kana' && value.includes(' ')) {
                const parts = value.split(' ')
                patientData['name_last_kana'] = parts[0]
                patientData['name_first_kana'] = parts[1] || ''
              } else {
                patientData[col.key] = value || null
              }
            }
          })
          
          // 必須項目チェック
          if (!patientData.name_last) {
            errors.push(`行${i + 1}: 姓が必要です`)
            continue
          }
          
          const { error } = await supabase.from('patients').insert(patientData)
          
          if (error) {
            errors.push(`行${i + 1}: ${error.message}`)
          } else {
            successCount++
          }
        } catch (err: any) {
          errors.push(`行${i + 1}: ${err.message}`)
        }
      }
      
      setResult({ success: successCount, errors })
      setStep(4)
      setImporting(false)
    }
    reader.readAsText(file, 'UTF-8')
  }

  const requiredMapped = DB_COLUMNS.filter(c => c.required).every(c => mapping[c.key])

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/patients" className="text-blue-600 hover:text-blue-800">← 患者一覧に戻る</Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-6">CSVインポート</h1>

        {/* ステップインジケーター */}
        <div className="flex items-center mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {s}
              </div>
              {s < 4 && <div className={`w-16 h-1 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
          <div className="ml-4 text-sm text-gray-600">
            {step === 1 && 'ファイル選択'}
            {step === 2 && 'カラムマッピング'}
            {step === 3 && 'インポート実行'}
            {step === 4 && '完了'}
          </div>
        </div>

        {/* Step 1: ファイル選択 */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="font-semibold text-gray-800 mb-4">1. CSVファイルを選択</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <div className="text-5xl mb-4">📁</div>
                <p className="text-lg text-gray-700 font-medium">クリックしてCSVファイルを選択</p>
                <p className="text-sm text-gray-500 mt-2">どんなフォーマットでもOK！次の画面でカラムを設定できます</p>
              </label>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">💡 対応フォーマット</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• レセコンからの出力CSV</li>
                <li>• Excelで作成したCSV</li>
                <li>• 他システムからのエクスポートデータ</li>
                <li>※ カラム名が違っても次の画面でマッピングできます</li>
              </ul>
            </div>
          </div>
        )}

        {/* Step 2: カラムマッピング */}
        {step === 2 && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="font-semibold text-gray-800 mb-4">2. カラムマッピング</h2>
            <p className="text-sm text-gray-600 mb-6">CSVの列と、システムの項目を対応付けてください。<span className="text-red-500">*</span>は必須です。</p>
            
            <div className="space-y-4">
              {DB_COLUMNS.map(col => (
                <div key={col.key} className="flex items-center gap-4">
                  <div className="w-40 text-sm font-medium text-gray-700">
                    {col.label} {col.required && <span className="text-red-500">*</span>}
                  </div>
                  <select
                    value={mapping[col.key] || ''}
                    onChange={(e) => handleMappingChange(col.key, e.target.value)}
                    className={`flex-1 border rounded-lg px-3 py-2 ${
                      col.required && !mapping[col.key] ? 'border-red-300 bg-red-50' : ''
                    }`}
                  >
                    <option value="">-- 選択しない --</option>
                    {csvHeaders.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* プレビュー */}
            <div className="mt-8">
              <h3 className="font-medium text-gray-800 mb-3">プレビュー（最初の{csvData.length}件）</h3>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {csvHeaders.map(h => (
                        <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {csvData.slice(0, 5).map((row, i) => (
                      <tr key={i}>
                        {row.map((val, j) => (
                          <td key={j} className="px-3 py-2 text-gray-700 whitespace-nowrap">{val || '-'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <button onClick={() => setStep(1)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                ← 戻る
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!requiredMapped}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                次へ →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: 確認・実行 */}
        {step === 3 && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="font-semibold text-gray-800 mb-4">3. インポート実行</h2>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800 font-medium">⚠️ インポート前の確認</p>
              <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                <li>• インポートするデータ: <strong>{csvData.length}件以上</strong></li>
                <li>• 重複する患者番号がある場合、エラーになることがあります</li>
                <li>• インポート後の取り消しはできません</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-800 mb-2">マッピング設定</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {DB_COLUMNS.filter(c => mapping[c.key]).map(col => (
                  <div key={col.key} className="flex">
                    <span className="text-gray-500 w-32">{col.label}:</span>
                    <span className="text-gray-800">{mapping[col.key]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                ← 戻る
              </button>
              <button
                onClick={handleImport}
                disabled={importing}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
              >
                {importing ? 'インポート中...' : '📥 インポートを実行'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: 結果 */}
        {step === 4 && result && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="font-semibold text-gray-800 mb-4">4. インポート完了</h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
                <span className="text-3xl">✅</span>
                <div>
                  <p className="font-medium text-green-800">{result.success} 件のインポートに成功しました</p>
                </div>
              </div>
              
              {result.errors.length > 0 && (
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="font-medium text-red-800 mb-2">⚠️ {result.errors.length} 件のエラー:</p>
                  <ul className="text-sm text-red-700 space-y-1 max-h-40 overflow-y-auto">
                    {result.errors.slice(0, 20).map((err, i) => (
                      <li key={i}>• {err}</li>
                    ))}
                    {result.errors.length > 20 && (
                      <li className="text-red-500">...他 {result.errors.length - 20} 件のエラー</li>
                    )}
                  </ul>
                </div>
              )}
              
              <div className="flex gap-4">
                <Link href="/patients" className="flex-1 text-center py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  患者一覧を確認
                </Link>
                <button
                  onClick={() => { setStep(1); setFile(null); setCsvHeaders([]); setCsvData([]); setMapping({}); setResult(null) }}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  続けてインポート
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
