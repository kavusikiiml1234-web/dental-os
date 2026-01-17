'use client'

import { useEffect, useState } from 'react'
import { supabase, Staff } from '@/lib/supabase'

export default function StaffSettingsPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState('dentist')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchStaff()
  }, [])

  async function fetchStaff() {
    setLoading(true)
    const { data } = await supabase
      .from('staff')
      .select('*')
      .order('staff_number')

    if (data) setStaff(data)
    setLoading(false)
  }

  async function addStaff() {
    if (!newName.trim()) return

    setSaving(true)
    const { error } = await supabase
      .from('staff')
      .insert({
        name: newName,
        role: newRole,
        is_active: true
      })

    if (!error) {
      setNewName('')
      fetchStaff()
    }
    setSaving(false)
  }

  const roleLabels: Record<string, string> = {
    dentist: '歯科医師',
    hygienist: '歯科衛生士',
    assistant: '歯科助手',
    receptionist: '受付',
    admin: '管理者',
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">スタッフ管理</h1>

      {/* 新規追加 */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">スタッフを追加</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="氏名"
            className="flex-1 border rounded-lg px-4 py-2"
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="border rounded-lg px-4 py-2"
          >
            <option value="dentist">歯科医師</option>
            <option value="hygienist">歯科衛生士</option>
            <option value="assistant">歯科助手</option>
            <option value="receptionist">受付</option>
            <option value="admin">管理者</option>
          </select>
          <button
            onClick={addStaff}
            disabled={saving || !newName.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            追加
          </button>
        </div>
      </div>

      {/* スタッフ一覧 */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-700">スタッフ一覧</h2>
        </div>
        
        {loading ? (
          <div className="p-6 text-center text-gray-500">読み込み中...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">番号</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">氏名</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">役職</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {staff.map(member => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {member.staff_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {member.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {roleLabels[member.role]}
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
