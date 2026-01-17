'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function PatientImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any[]>([])
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
      const headers = lines[0].split(',').map(h => h.trim())
      
      const data = lines.slice(1, 6).map(line => {
        const values = line.split(',').map(v => v.trim())
        const row: any = {}
        headers.forEach((h, i) => { row[h] = values[i] || '' })
        return row
      })
      
      setPreview(data)
    }
    reader.readAsText(selectedFile, 'UTF-8')
  }

  async function handleImport() {
    if (!file) return
    
    setImporting(true)
    setResult(null)
    
    const reader = new FileReader()
    reader.onload = async (event) => {
      const text = event.target?.result as string
      const lines = text.split('\n').filter(line => line.trim())
      const headers = lines[0].split(',').map(h => h.trim())
      
      let successCount = 0
      const errors: string[] = []
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
        const row: any = {}
        headers.forEach((h, idx) => { row[h] = values[idx] || '' })
        
        try {
          // CSVカラム名をDBカラム名にマッピング
          const patientData: any = {
            patient_number: row['患者番号'] || row['patient_number'] || null,
            name_last: row['姓'] || row['name_last'] || '',
            name_first: row['名'] || row['name_first'] || '',
            name_last_kana: row['セイ'] || row['name_last_kana'] || '',
            name_first_kana: row['メイ'] || row['name_first_kana'] || '',
            phone: row['電話番号'] || row['phone'] || null,
            email: row['メール'] || row['email'] || null,
            birth_date: row['生年月日'] || row['birth_date'] || null,
            gender: row['性別'] || row['gender'] || null,
            address: row['住所'] || row['address'] || null,
            is_active: true
          }
          
          // 性別の変換
          if (patientData.gender === '男' || patientData.gender === '男性') patientData.gender = 'male'
          if (patientData.gender === '女' || patientData.gender === '女性') patientData.gender = 'female'
          
          // 必須項目チェック
          if (!patientData.name_last || !patientData.name_first) {
            errors.push(`行${i + 1}: 氏名が必要です`)
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
      setImporting(false)
    }
    reader.readAsText(file, 'UTF-8')
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/patients" className="text-blue-600 hover:text-blue-800">← 患者一覧に戻る</Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-6">CSVインポート</h1>

        {/* 説明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-blue-800 mb-3">📋 CSVフォーマット</h2>
          <p className="text-sm text-blue-700 mb-3">以下のカラムを含むCSVファイルをアップロードしてください：</p>
          <div className="bg-white rounded p-3 text-sm font-mono text-gray-600 overflow-x-auto">
            患者番号,姓,名,セイ,メイ,電話番号,メール,生年月日,性別,住所
          </div>
          <p className="text-xs text-blue-600 mt-3">
            ※ 姓・名は必須です。他は任意。<br />
            ※ 生年月日は YYYY-MM-DD 形式<br />
            ※ 性別は「男」「女」または「male」「female」
          </p>
        </div>

        {/* ファイルアップロード */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="font-semibold text-gray-800 mb-4">1. CSVファイルを選択</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer">
              <div className="text-4xl mb-3">📁</div>
              <p className="text-gray-600">クリックしてCSVファイルを選択</p>
              <p className="text-sm text-gray-400 mt-2">または、ファイルをドラッグ＆ドロップ</p>
            </label>
          </div>
          {file && (
            <p className="mt-3 text-sm text-green-600">✓ {file.name} を選択しました</p>
          )}
        </div>

        {/* プレビュー */}
        {preview.length > 0 && (
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <h2 className="font-semibold text-gray-800 mb-4">2. プレビュー（最初の5件）</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(preview[0]).map(key => (
                      <th key={key} className="px-3 py-2 text-left text-xs font-medium text-gray-500">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {preview.map((row, i) => (
                    <tr key={i}>
                      {Object.values(row).map((val: any, j) => (
                        <td key={j} className="px-3 py-2 text-gray-700">{val || '-'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* インポートボタン */}
        {preview.length > 0 && !result && (
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <h2 className="font-semibold text-gray-800 mb-4">3. インポート実行</h2>
            <button
              onClick={handleImport}
              disabled={importing}
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
            >
              {importing ? 'インポート中...' : '📥 インポートを実行'}
            </button>
          </div>
        )}

        {/* 結果 */}
        {result && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="font-semibold text-gray-800 mb-4">結果</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="font-medium text-green-800">{result.success} 件のインポートに成功</p>
                </div>
              </div>
              
              {result.errors.length > 0 && (
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="font-medium text-red-800 mb-2">⚠️ {result.errors.length} 件のエラー:</p>
                  <ul className="text-sm text-red-700 space-y-1 max-h-40 overflow-y-auto">
                    {result.errors.map((err, i) => (
                      <li key={i}>• {err}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <Link href="/patients" className="block w-full text-center py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                患者一覧に戻る
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
