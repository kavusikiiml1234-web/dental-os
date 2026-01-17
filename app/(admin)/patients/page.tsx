'use client'

import { useEffect, useState } from 'react'
import { supabase, Patient } from '@/lib/supabase'
import Link from 'next/link'
import { format } from 'date-fns'

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<'patient_number' | 'name_last' | 'created_at'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => { fetchPatients() }, [sortField, sortOrder])

  async function fetchPatients() {
    setLoading(true)
    const { data, count } = await supabase
      .from('patients')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order(sortField, { ascending: sortOrder === 'asc' })
      .limit(100)
    if (data) setPatients(data)
    if (count !== null) setTotalCount(count)
    setLoading(false)
  }

  async function searchPatients() {
    if (!searchQuery.trim()) { fetchPatients(); return }
    setLoading(true)
    const { data, count } = await supabase
      .from('patients')
      .select('*', { count: 'exact' })
      .or(`phone.ilike.%${searchQuery}%,name_last.ilike.%${searchQuery}%,name_first.ilike.%${searchQuery}%,name_last_kana.ilike.%${searchQuery}%,name_first_kana.ilike.%${searchQuery}%`)
      .eq('is_active', true)
      .order(sortField, { ascending: sortOrder === 'asc' })
      .limit(100)
    if (data) setPatients(data)
    if (count !== null) setTotalCount(count)
    setLoading(false)
  }

  function handleSort(field: 'patient_number' | 'name_last' | 'created_at') {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <span className="text-gray-300 ml-1">↕</span>
    return sortOrder === 'asc' ? <span className="text-blue-600 ml-1">↑</span> : <span className="text-blue-600 ml-1">↓</span>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">患者管理</h1>
          <p className="text-sm text-gray-500">全 {totalCount} 名</p>
        </div>
        <div className="flex gap-3">
          <Link href="/patients/import" className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            📥 CSVインポート
          </Link>
          <Link href="/patients/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            ＋ 新規患者登録
          </Link>
        </div>
      </div>

      {/* 検索バー */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <form onSubmit={(e) => { e.preventDefault(); searchPatients() }} className="flex gap-4">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="患者名、フリガナ、電話番号で検索..."
              className="w-full border rounded-lg pl-10 pr-4 py-2"
            />
          </div>
          <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            検索
          </button>
          {searchQuery && (
            <button 
              type="button" 
              onClick={() => { setSearchQuery(''); fetchPatients() }} 
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
            >
              クリア
            </button>
          )}
        </form>
      </div>

      {/* 患者一覧 */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">読み込み中...</div>
        ) : patients.length === 0 ? (
          <div className="p-6 text-center text-gray-500">患者が見つかりません</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('patient_number')}
                >
                  患者番号 <SortIcon field="patient_number" />
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name_last')}
                >
                  氏名 <SortIcon field="name_last" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">フリガナ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">電話番号</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">生年月日</th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('created_at')}
                >
                  登録日 <SortIcon field="created_at" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {patients.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.patient_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{p.name_last} {p.name_first}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {p.name_last_kana} {p.name_first_kana}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.phone || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.birth_date || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(p.created_at), 'yyyy/MM/dd')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                    <Link href={`/charts/${p.id}`} className="text-green-600 hover:underline">カルテ</Link>
                    <Link href={`/patients/${p.id}`} className="text-blue-600 hover:underline">詳細</Link>
                    <Link href={`/reservations/new?patient=${p.id}`} className="text-purple-600 hover:underline">予約</Link>
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
