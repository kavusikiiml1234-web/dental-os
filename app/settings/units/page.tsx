'use client'

import { useEffect, useState } from 'react'
import { supabase, Unit } from '@/lib/supabase'

export default function UnitsSettingsPage() {
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [newUnitName, setNewUnitName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchUnits()
  }, [])

  async function fetchUnits() {
    setLoading(true)
    const { data } = await supabase
      .from('units')
      .select('*')
      .order('unit_number')

    if (data) setUnits(data)
    setLoading(false)
  }

  async function addUnit() {
    if (!newUnitName.trim()) return

    setSaving(true)
    const nextNumber = units.length > 0 ? Math.max(...units.map(u => u.unit_number)) + 1 : 1

    const { error } = await supabase
      .from('units')
      .insert({
        unit_number: nextNumber,
        name: newUnitName,
        is_active: true
      })

    if (!error) {
      setNewUnitName('')
      fetchUnits()
    }
    setSaving(false)
  }

  async function toggleUnitActive(unit: Unit) {
    await supabase
      .from('units')
      .update({ is_active: !unit.is_active })
      .eq('id', unit.id)

    fetchUnits()
  }

  async function deleteUnit(unit: Unit) {
    if (!confirm(`${unit.name}を削除しますか？`)) return

    await supabase
      .from('units')
      .delete()
      .eq('id', unit.id)

    fetchUnits()
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">ユニット管理</h1>

      {/* 新規追加 */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">ユニットを追加</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={newUnitName}
            onChange={(e) => setNewUnitName(e.target.value)}
            placeholder="ユニット名（例：ユニット4）"
            className="flex-1 border rounded-lg px-4 py-2"
          />
          <button
            onClick={addUnit}
            disabled={saving || !newUnitName.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            追加
          </button>
        </div>
      </div>

      {/* ユニット一覧 */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-700">ユニット一覧</h2>
        </div>
        
        {loading ? (
          <div className="p-6 text-center text-gray-500">読み込み中...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">番号</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">名前</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ステータス</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {units.map(unit => (
                <tr key={unit.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {unit.unit_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {unit.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      unit.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {unit.is_active ? '有効' : '無効'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => toggleUnitActive(unit)}
                      className="text-blue-600 hover:underline mr-4"
                    >
                      {unit.is_active ? '無効にする' : '有効にする'}
                    </button>
                    <button
                      onClick={() => deleteUnit(unit)}
                      className="text-red-600 hover:underline"
                    >
                      削除
                    </button>
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
