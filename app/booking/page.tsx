'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { format, addDays, startOfWeek, isBefore, isToday } from 'date-fns'
import { ja } from 'date-fns/locale'

export default function BookingPage() {
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [reservedSlots, setReservedSlots] = useState<{[key: string]: string[]}>({})
  const [loading, setLoading] = useState(true)

  // 営業時間
  const businessHours = {
    start: 9,
    end: 18,
    interval: 30 // 分
  }

  // 休診日（曜日: 0=日, 6=土）
  const closedDays = [0] // 日曜休み

  // 週の日付を生成
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i))

  // 時間枠を生成
  const timeSlots = Array.from(
    { length: ((businessHours.end - businessHours.start) * 60) / businessHours.interval },
    (_, i) => {
      const totalMinutes = businessHours.start * 60 + i * businessHours.interval
      const hours = Math.floor(totalMinutes / 60)
      const minutes = totalMinutes % 60
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    }
  )

  useEffect(() => {
    fetchReservedSlots()
  }, [currentWeekStart])

  async function fetchReservedSlots() {
    setLoading(true)
    const startDate = format(currentWeekStart, 'yyyy-MM-dd')
    const endDate = format(addDays(currentWeekStart, 6), 'yyyy-MM-dd')

    const { data, error } = await supabase
      .from('reservations')
      .select('reservation_date, start_time')
      .gte('reservation_date', startDate)
      .lte('reservation_date', endDate)
      .neq('status', 'cancelled')

    if (!error && data) {
      const slots: {[key: string]: string[]} = {}
      data.forEach(r => {
        if (!slots[r.reservation_date]) {
          slots[r.reservation_date] = []
        }
        slots[r.reservation_date].push(r.start_time.slice(0, 5))
      })
      setReservedSlots(slots)
    }
    setLoading(false)
  }

  function isSlotAvailable(date: Date, time: string): boolean {
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayOfWeek = date.getDay()

    // 休診日チェック
    if (closedDays.includes(dayOfWeek)) return false

    // 過去の日付チェック
    if (isBefore(date, new Date()) && !isToday(date)) return false

    // 今日の過去時間チェック
    if (isToday(date)) {
      const now = new Date()
      const [hours, minutes] = time.split(':').map(Number)
      const slotTime = new Date(date)
      slotTime.setHours(hours, minutes, 0, 0)
      if (isBefore(slotTime, now)) return false
    }

    // 予約済みチェック
    const reserved = reservedSlots[dateStr] || []
    if (reserved.includes(time)) return false

    return true
  }

  function handleDateSelect(date: Date) {
    const dateStr = format(date, 'yyyy-MM-dd')
    setSelectedDate(dateStr)
    setSelectedTime(null)
  }

  function handleTimeSelect(time: string) {
    setSelectedTime(time)
  }

  function handlePrevWeek() {
    setCurrentWeekStart(prev => addDays(prev, -7))
    setSelectedDate(null)
    setSelectedTime(null)
  }

  function handleNextWeek() {
    setCurrentWeekStart(prev => addDays(prev, 7))
    setSelectedDate(null)
    setSelectedTime(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            🦷 〇〇歯科クリニック
          </h1>
          <p className="text-gray-600 mt-1">Web予約</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* ステップ表示 */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="flex items-center">
            <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
            <span className="ml-2 text-sm font-medium text-blue-600">日時選択</span>
          </div>
          <div className="w-8 h-px bg-gray-300"></div>
          <div className="flex items-center">
            <span className="w-8 h-8 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center text-sm font-bold">2</span>
            <span className="ml-2 text-sm text-gray-500">情報入力</span>
          </div>
          <div className="w-8 h-px bg-gray-300"></div>
          <div className="flex items-center">
            <span className="w-8 h-8 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center text-sm font-bold">3</span>
            <span className="ml-2 text-sm text-gray-500">確認</span>
          </div>
        </div>

        {/* カレンダー */}
        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={handlePrevWeek}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              ◀ 前週
            </button>
            <h2 className="text-lg font-semibold">
              {format(currentWeekStart, 'yyyy年M月', { locale: ja })}
            </h2>
            <button
              onClick={handleNextWeek}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              次週 ▶
            </button>
          </div>

          {/* 日付選択 */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {weekDates.map(date => {
              const dateStr = format(date, 'yyyy-MM-dd')
              const dayOfWeek = date.getDay()
              const isClosed = closedDays.includes(dayOfWeek)
              const isPast = isBefore(date, new Date()) && !isToday(date)
              const isSelected = selectedDate === dateStr
              const isAvailable = !isClosed && !isPast

              return (
                <button
                  key={dateStr}
                  onClick={() => isAvailable && handleDateSelect(date)}
                  disabled={!isAvailable}
                  className={`
                    p-3 rounded-lg text-center transition
                    ${isSelected ? 'bg-blue-600 text-white' : ''}
                    ${isAvailable && !isSelected ? 'hover:bg-blue-50 border border-gray-200' : ''}
                    ${!isAvailable ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}
                    ${dayOfWeek === 0 ? 'text-red-500' : ''}
                    ${dayOfWeek === 6 ? 'text-blue-500' : ''}
                    ${isSelected && dayOfWeek === 0 ? 'text-white' : ''}
                    ${isSelected && dayOfWeek === 6 ? 'text-white' : ''}
                  `}
                >
                  <div className="text-xs mb-1">
                    {format(date, 'E', { locale: ja })}
                  </div>
                  <div className="text-lg font-bold">
                    {format(date, 'd')}
                  </div>
                  {isClosed && <div className="text-xs">休</div>}
                </button>
              )
            })}
          </div>

          {/* 時間選択 */}
          {selectedDate && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                {format(new Date(selectedDate + 'T00:00:00'), 'M月d日(E)', { locale: ja })} の予約可能時間
              </h3>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {timeSlots.map(time => {
                  const isAvailable = isSlotAvailable(new Date(selectedDate + 'T00:00:00'), time)
                  const isSelected = selectedTime === time

                  return (
                    <button
                      key={time}
                      onClick={() => isAvailable && handleTimeSelect(time)}
                      disabled={!isAvailable}
                      className={`
                        py-2 px-3 rounded-lg text-sm font-medium transition
                        ${isSelected ? 'bg-blue-600 text-white' : ''}
                        ${isAvailable && !isSelected ? 'bg-gray-100 hover:bg-blue-100 text-gray-700' : ''}
                        ${!isAvailable ? 'bg-gray-200 text-gray-400 cursor-not-allowed line-through' : ''}
                      `}
                    >
                      {time}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* 次へボタン */}
        {selectedDate && selectedTime && (
          <div className="text-center">
            <Link
              href={`/booking/form?date=${selectedDate}&time=${selectedTime}`}
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              次へ進む →
            </Link>
          </div>
        )}

        {/* 注意事項 */}
        <div className="mt-8 text-sm text-gray-500">
          <h3 className="font-medium mb-2">ご予約に関する注意事項</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>ご予約の変更・キャンセルは前日までにお電話ください</li>
            <li>初診の方は予約時間の15分前にお越しください</li>
            <li>保険証をお忘れなくお持ちください</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
