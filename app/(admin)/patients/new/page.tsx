'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewPatientPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    patient_number: '',
    name_last: '',
    name_first: '',
    name_last_kana: '',
    name_first_kana: '',
    phone: '',
    email: '',
    birth_date: '',
    gender: '',
    address: ''
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    
    if (!formData.name_last || !formData.name_first) {
      setError('氏名は必須です')
      return
    }
    
    setSaving(true)
    
    const { data, error: insertError } = await supabase.from('patients').insert({
      patient_number: formData.patient_number || null,
      name_last: formData.name_last,
      name_first: formData.name_first,
      name_last_kana: formData.name_last_kana || null,
      name_first_kana: formData.name_first_kana || null,
      phone: formData.phone || null,
      email: formData.email || null,
      birth_date: formData.birth_date || null,
      gender: formData.gender || null,
      address: formData.address || null,
      is_active: true
    }).select().single()
    
    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }
    
    router.push(`/patients/${data.id}`)
  }

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/patients" className="text-blue-600 hover:text-blue-800">← 患者一覧に戻る</Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-6">新規患者登録</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-6">
          {/* 患者番号 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">患者番号</label>
            <input
              type="text"
              name="patient_number"
              value={formData.patient_number}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="自動採番の場合は空欄"
            />
          </div>

          {/* 氏名 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">姓 <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="name_last"
                value={formData.name_last}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">名 <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="name_first"
                value={formData.name_first}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
          </div>

          {/* フリガナ */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">セイ</label>
              <input
                type="text"
                name="name_last_kana"
                value={formData.name_last_kana}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">メイ</label>
              <input
                type="text"
                name="name_first_kana"
                value={formData.name_first_kana}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>

          {/* 連絡先 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">電話番号</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>

          {/* 生年月日・性別 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">生年月日</label>
              <input
                type="date"
                name="birth_date"
                value={formData.birth_date}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">性別</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">選択してください</option>
                <option value="male">男性</option>
                <option value="female">女性</option>
                <option value="other">その他</option>
              </select>
            </div>
          </div>

          {/* 住所 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">住所</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          {/* ボタン */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {saving ? '登録中...' : '患者を登録'}
            </button>
            <Link
              href="/patients"
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-center"
            >
              キャンセル
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
