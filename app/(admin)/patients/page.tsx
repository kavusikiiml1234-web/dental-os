'use client'

import { useEffect, useState } from 'react'
import { supabase, Patient } from '@/lib/supabase'
import Link from 'next/link'

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => { fetchPatients() }, [])

  async function fetchPatients() {
    setLoading(true)
    const { data } = await supabase.from('patients').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(100)
    if (data) setPatients(data)
    setLoading(false)
  }

  async function searchPatients() {
    if (!searchQuery.trim()) { fetchPatients(); return }
    setLoading(true)
    const { data } = await supabase.from('patients').select('*').or(`phone.ilike.%${searchQuery}%,name_last.ilike.%${searchQuery}%,name_first.ilike.%${searchQuery}%`).eq('is_active', true).limit(100)
    if (data) setPatients(data)
    setLoading(false)
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">患者管理</h1>
        <Link href="/patients/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">＋ 新規患者登録</Link>
      </div>
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <form onSubmit={(e) => { e.preventDefault(); searchPatients() }} className="flex gap-4">
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="電話番号または名前で検索..." className="flex-1 border rounded-lg px-4 py-2" />
          <button type="submit" className="px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg">検索</button>
        </form>
      </div>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? <div className="p-6 text-center text-gray-500">読み込み中...</div> : patients.length === 0 ? <div className="p-6 text-center text-gray-500">患者が見つかりません</div> : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">患者番号</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">氏名</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">電話番号</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">生年月日</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {patients.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.patient_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.name_last} {p.name_first}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.phone || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.birth_date || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link href={`/patients/${p.id}`} className="text-blue-600 hover:underline mr-3">詳細</Link>
                    <Link href={`/reservations/new?patient=${p.id}`} className="text-green-600 hover:underline">予約</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
