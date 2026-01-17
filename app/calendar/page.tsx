'use client'

import { useEffect, useState } from 'react'
import { supabase, Reservation, Unit } from '@/lib/supabase'
import Link from 'next/link'
import { format, addDays, startOfWeek, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'

export default function CalendarPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day')

  // 営業時間
  const startHour = 9
  const endHour = 19
  const timeSlots = Array.from({ length: (endHour - startHour) * 2 }, (_, i) => {
    const hour = Math.floor(i / 2) + startHour
    const minute = (i % 2) * 30
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  })

  useEffect(() => {
    fetchUnits()
  }, [])

  useEffect(() => {
    fetchReservations()
  }, [currentDate, viewMode])

  async function fetchUnits() {
    const { data } = await supabase
      .from('units')
      .select('*')
      .eq('is_active', true)
      .order('unit_number')
    
    if (data) setUnits(data)
  }

  async function fetchReservations() {
    setLoading(true)
    
    const dateStr = format(currentDate, 'yyyy-MM-dd')
    
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        patients (id, name_last, name_first, phone),
        units (id, name, unit_number)
      `)
      .eq('reservation_date', dateStr)
      .neq('status', 'cancelled')
      .order('start_time')

    if (!error && data) {
      setReservations(data)
    }
    setLoading(false)
  }

  const categoryColors: Record<string, string> = {
    first_visit: 'bg-purple-500',
    checkup: 'bg-green-500',
    treatment: 'bg-blue-500',
    consultation: 'bg-yellow-500',
    emergency: 'bg-red-500',
    other: 'bg-gray-500',
  }

  const categoryLabels: Record<string, string> = {
    first_visit: '初診',
    checkup: '検診',
    treatment: '治療',
    consultation: '相談',
    emergency: '急患',
    other: '他',
  }

  function getReservationsForSlot(unitId: string, time: string) {
    return reservations.filter(r => 
      r.unit_id === unitId && 
      r.start_time?.slice(0, 5) === time
    )
  }

  function handlePrevDay() {
    setCurrentDate(prev => addDays(prev, -1))
  }

  function handleNextDay() {
    setCurrentDate(prev => addDays(prev, 1))
  }

  function handleToday() {
    setCurrentDate(new Date())
  }

  return (
    <div className="p-6 h-screen flex flex-col">
      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800">予約カレンダー</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevDay}
              className="p-2 hover:bg-gray-200 rounded-lg transition"
            >
              ◀
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition"
            >
              今日
            </button>
            <button
              onClick={handleNextDay}
              className="p-2 hover:bg-gray-200 rounded-lg transition"
            >
              ▶
            </button>
          </div>
          <span className="text-lg font-medium text-gray-700">
            {format(currentDate, 'yyyy年M月d日(E)', { locale: ja })}
          </span>
        </div>
        <Link
          href="/reservations/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          ＋ 新規予約
        </Link>
      </div>

      {/* カレンダー本体 */}
      <div className="flex-1 bg-white rounded-xl shadow overflow-hidden flex flex-col">
        {/* ユニットヘッダー */}
        <div className="flex border-b bg-gray-50">
          <div className="w-20 flex-shrink-0 p-2 text-center text-sm font-medium text-gray-500 border-r">
            時間
          </div>
          {units.map(unit => (
            <div 
              key={unit.id} 
              className="flex-1 p-2 text-center text-sm font-medium text-gray-700 border-r last:border-r-0"
            >
              {unit.name}
            </div>
          ))}
        </div>

        {/* タイムスロット */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center text-gray-500">読み込み中...</div>
          ) : (
            <div>
              {timeSlots.map((time, index) => (
                <div key={time} className="flex border-b last:border-b-0">
                  {/* 時間ラベル */}
                  <div className="w-20 flex-shrink-0 p-2 text-xs text-gray-500 border-r bg-gray-50 text-center">
                    {time}
                  </div>
                  
                  {/* 各ユニットのスロット */}
                  {units.map(unit => {
                    const slotReservations = getReservationsForSlot(unit.id, time)
                    
                    return (
                      <div 
                        key={`${unit.id}-${time}`}
                        className="flex-1 min-h-[48px] p-1 border-r last:border-r-0 hover:bg-blue-50 cursor-pointer relative"
                        onClick={() => {
                          if (slotReservations.length === 0) {
                            window.location.href = `/reservations/new?date=${format(currentDate, 'yyyy-MM-dd')}&time=${time}&unit=${unit.id}`
                          }
                        }}
                      >
                        {slotReservations.map(reservation => (
                          <Link
                            key={reservation.id}
                            href={`/reservations/${reservation.id}`}
                            className={`block rounded px-2 py-1 text-white text-xs mb-1 ${categoryColors[reservation.category || 'other']} hover:opacity-80`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="font-medium truncate">
                              {reservation.patients?.name_last} {reservation.patients?.name_first}
                            </div>
                            <div className="opacity-80">
                              {categoryLabels[reservation.category || 'other']}
                            </div>
                          </Link>
                        ))}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 凡例 */}
      <div className="mt-4 flex gap-4 text-sm">
        <span className="text-gray-500">凡例:</span>
        {Object.entries(categoryLabels).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1">
            <span className={`w-3 h-3 rounded ${categoryColors[key]}`}></span>
            <span className="text-gray-600">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
