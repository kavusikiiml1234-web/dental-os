'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

function BookingFormContent() {
  const searchParams = useSearchParams()
  const date = searchParams.get('date') || ''
  const time = searchParams.get('time') || ''

  const [nameLast, setNameLast] = useState('')
  const [nameFirst, setNameFirst] = useState('')
  const [nameLastKana, setNameLastKana] = useState('')
  const [nameFirstKana, setNameFirstKana] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [category, setCategory] = useState('treatment')
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  function validate(): boolean {
    const newErrors: {[key: string]: string} = {}
    if (!nameLast.trim()) newErrors.nameLast = '姓を入力してください'
    if (!nameFirst.trim()) newErrors.nameFirst = '名を入力してください'
    if (!phone.trim()) newErrors.phone = '電話番号を入力してください'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    const params = new URLSearchParams({ date, time, nameLast, nameFirst, nameLastKana, nameFirstKana, birthDate, gender, phone, email, category, note })
    window.location.href = `/booking/confirm?${params.toString()}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">🦷 〇〇歯科クリニック</h1>
          <p className="text-gray-600 mt-1">Web予約</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="flex items-center"><span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">✓</span><span className="ml-2 text-sm text-green-600">日時選択</span></div>
          <div className="w-8 h-px bg-green-500"></div>
          <div className="flex items-center"><span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span><span className="ml-2 text-sm font-medium text-blue-600">情報入力</span></div>
          <div className="w-8 h-px bg-gray-300"></div>
          <div className="flex items-center"><span className="w-8 h-8 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center text-sm font-bold">3</span><span className="ml-2 text-sm text-gray-500">確認</span></div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800"><span className="font-medium">ご予約日時：</span>{date && format(new Date(date + 'T00:00:00'), 'yyyy年M月d日(E)', { locale: ja })} {time}</p>
          <Link href="/booking" className="text-sm text-blue-600 hover:underline">← 日時を変更する</Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">患者情報の入力</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">姓 <span className="text-red-500">*</span></label><input type="text" value={nameLast} onChange={(e) => setNameLast(e.target.value)} className={`w-full border rounded-lg px-4 py-3 ${errors.nameLast ? 'border-red-500' : 'border-gray-300'}`} placeholder="山田" />{errors.nameLast && <p className="text-red-500 text-xs mt-1">{errors.nameLast}</p>}</div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">名 <span className="text-red-500">*</span></label><input type="text" value={nameFirst} onChange={(e) => setNameFirst(e.target.value)} className={`w-full border rounded-lg px-4 py-3 ${errors.nameFirst ? 'border-red-500' : 'border-gray-300'}`} placeholder="太郎" />{errors.nameFirst && <p className="text-red-500 text-xs mt-1">{errors.nameFirst}</p>}</div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">セイ</label><input type="text" value={nameLastKana} onChange={(e) => setNameLastKana(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-3" placeholder="ヤマダ" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">メイ</label><input type="text" value={nameFirstKana} onChange={(e) => setNameFirstKana(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-3" placeholder="タロウ" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">生年月日</label><input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-3" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">性別</label><select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-3"><option value="">選択してください</option><option value="male">男性</option><option value="female">女性</option><option value="other">その他</option></select></div>
          </div>
          <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1">電話番号 <span className="text-red-500">*</span></label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={`w-full border rounded-lg px-4 py-3 ${errors.phone ? 'border-red-500' : 'border-gray-300'}`} placeholder="090-1234-5678" />{errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}</div>
          <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-3" placeholder="example@email.com" /></div>
          <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1">診療内容</label><select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-3"><option value="first_visit">初診</option><option value="checkup">定期検診</option><option value="treatment">治療</option><option value="consultation">相談</option><option value="emergency">急患・痛みがある</option></select></div>
          <div className="mb-6"><label className="block text-sm font-medium text-gray-700 mb-1">ご要望・症状など</label><textarea value={note} onChange={(e) => setNote(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-3" rows={3} placeholder="気になる症状があればご記入ください" /></div>
          <div className="flex gap-4">
            <Link href="/booking" className="flex-1 text-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">戻る</Link>
            <button type="submit" className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">確認画面へ →</button>
          </div>
        </form>
      </main>
    </div>
  )
}

export default function BookingFormPage() {
  return <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">読み込み中...</div>}><BookingFormContent /></Suspense>
}
