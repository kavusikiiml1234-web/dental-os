import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 型定義
export type Patient = {
  id: string
  patient_number: number
  name_last: string
  name_first: string
  name_last_kana?: string
  name_first_kana?: string
  birth_date?: string
  gender?: 'male' | 'female' | 'other'
  phone?: string
  email?: string
  address?: string
  created_at: string
}

export type Unit = {
  id: string
  unit_number: number
  name: string
  is_active: boolean
}

export type Reservation = {
  id: string
  patient_id?: string
  unit_id?: string
  reservation_date: string
  start_time: string
  end_time?: string
  category?: 'first_visit' | 'checkup' | 'treatment' | 'consultation' | 'emergency' | 'other'
  status: 'tentative' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  source?: 'manual' | 'phone' | 'web' | 'line' | 'ai_phone'
  interview_completed: boolean
  note?: string
  created_at: string
  patients?: Patient
  units?: Unit
}

export type Staff = {
  id: string
  staff_number: number
  name: string
  role: 'dentist' | 'hygienist' | 'assistant' | 'receptionist' | 'admin'
}
