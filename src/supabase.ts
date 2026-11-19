import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

const hasValidEnv = Boolean(
  url &&
  anonKey &&
  /^https?:\/\//.test(url) &&
  !url.includes('your-project')
)

export const isDemoMode = !hasValidEnv

// --- Local Demo Store (used only when Supabase env vars are not configured) ---
const STORAGE_KEY = 'careconnect_demo_db_v1'

type Row = Record<string, any>

interface DemoDatabase {
  patients: Row[]
  doctors: Row[]
  appointments: Row[]
}

function getRelativeISTTimestamp(dayOffset: number, timeHHMM: string): string {
  const now = new Date()
  const istNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  istNow.setDate(istNow.getDate() + dayOffset)
  const y = istNow.getFullYear()
  const m = String(istNow.getMonth() + 1).padStart(2, '0')
  const d = String(istNow.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}T${timeHHMM}:00+05:30`
}

function createInitialSeed(): DemoDatabase {
  const doc1Id = 'e23dc9de-0c45-4a57-a084-b1404eed7588'
  const doc2Id = 'b91a4f70-51bc-4e33-9a8d-7c210e9a1102'
  const doc3Id = 'c44d8b21-88fa-47c9-8d1a-5e321fa98433'
  const doc4Id = 'd77f3a10-22be-41b2-a1c5-9f887de65211'
  const doc5Id = 'a12c9e88-7410-4c9a-9012-3b445fa19876'

  const pat1Id = 'pat-1001-aarya'
  const pat2Id = 'pat-1002-rohan'
  const pat3Id = 'pat-1003-meera'

  return {
    patients: [
      {
        id: pat1Id,
        name: 'Aarav Kulkarni',
        email: 'patient1@demo.com',
        phone: '9876543210',
        password: 'pat123',
        gender: 'Male',
        wallet_balance: 5000,
        transaction_pin: '1234',
      },
      {
        id: pat2Id,
        name: 'Meera Nair',
        email: 'meera.nair@demo.com',
        phone: '9845011223',
        password: 'pat123',
        gender: 'Female',
        wallet_balance: 3200,
        transaction_pin: '1234',
      },
      {
        id: pat3Id,
        name: 'Rohan Deshmukh',
        email: 'rohan.d@demo.com',
        phone: '9900112233',
        password: 'pat123',
        gender: 'Male',
        wallet_balance: 2500,
        transaction_pin: '1234',
      },
    ],
    doctors: [
      {
        id: doc1Id,
        name: 'Dr. Vikram Sharma',
        email: 'doctor1@demo.com',
        phone: '9880123456',
        password: 'doc123',
        specialty: 'Cardiology',
        clinic_name: 'PulseHeart Clinic',
        area: 'Indiranagar, Bengaluru',
        address: '100 Feet Road, HAL 2nd Stage, Indiranagar, Bengaluru 560038',
        experience: '12 yrs exp',
        education: 'MBBS, MD, DM',
        gender: 'Male',
        consultation_fee: 800,
      },
      {
        id: doc2Id,
        name: 'Dr. Ananya Rao',
        email: 'ananya.rao@demo.com',
        phone: '9880234567',
        password: 'doc123',
        specialty: 'Dermatology',
        clinic_name: 'DermaGlow Studio',
        area: 'Koramangala, Bengaluru',
        address: '80 Feet Road, 4th Block, Koramangala, Bengaluru 560034',
        experience: '9 yrs exp',
        education: 'MBBS, MD (DVL)',
        gender: 'Female',
        consultation_fee: 650,
      },
      {
        id: doc3Id,
        name: 'Dr. Karthik Menon',
        email: 'karthik.m@demo.com',
        phone: '9880345678',
        password: 'doc123',
        specialty: 'General Medicine',
        clinic_name: 'CareFirst Polyclinic',
        area: 'Jayanagar, Bengaluru',
        address: '11th Main Road, 4th Block, Jayanagar, Bengaluru 560011',
        experience: '14 yrs exp',
        education: 'MBBS, MD',
        gender: 'Male',
        consultation_fee: 500,
      },
      {
        id: doc4Id,
        name: 'Dr. Sneha Hegde',
        email: 'sneha.h@demo.com',
        phone: '9880456789',
        password: 'doc123',
        specialty: 'Pediatrics',
        clinic_name: 'LittleSteps Child Care',
        area: 'Whitefield, Bengaluru',
        address: 'ITPL Main Road, Brookefield, Whitefield, Bengaluru 560066',
        experience: '10 yrs exp',
        education: 'MBBS, DCH, DNB',
        gender: 'Female',
        consultation_fee: 600,
      },
      {
        id: doc5Id,
        name: 'Dr. Siddharth Iyer',
        email: 'siddharth.i@demo.com',
        phone: '9880567890',
        password: 'doc123',
        specialty: 'Orthopedics',
        clinic_name: 'OrthoMotion Center',
        area: 'Malleshwaram, Bengaluru',
        address: 'Sampige Road, 8th Cross, Malleshwaram, Bengaluru 560003',
        experience: '15 yrs exp',
        education: 'MBBS, MS (Ortho)',
        gender: 'Male',
        consultation_fee: 750,
      },
    ],
    appointments: [
      {
        id: 'appt-101',
        patient_id: pat1Id,
        patient_phone: '9876543210',
        patient_email: 'patient1@demo.com',
        doctor_id: doc1Id,
        appointment_time: getRelativeISTTimestamp(0, '16:00'),
        reason: 'Routine ECG & blood pressure follow-up',
        status: 'Confirmed',
        notes: 'Bring previous lipid profile report.',
      },
      {
        id: 'appt-102',
        patient_id: pat1Id,
        patient_phone: '9876543210',
        patient_email: 'patient1@demo.com',
        doctor_id: doc2Id,
        appointment_time: getRelativeISTTimestamp(1, '11:00'),
        reason: 'Seasonal skin allergy consultation',
        status: 'Awaiting Doctor',
        notes: '',
      },
      {
        id: 'appt-103',
        patient_id: pat1Id,
        patient_phone: '9876543210',
        patient_email: 'patient1@demo.com',
        doctor_id: doc3Id,
        appointment_time: getRelativeISTTimestamp(2, '10:00'),
        reason: 'Annual health checkup & vitamin panel',
        status: 'Unpaid',
        notes: '',
      },
      {
        id: 'appt-104',
        patient_id: pat1Id,
        patient_phone: '9876543210',
        patient_email: 'patient1@demo.com',
        doctor_id: doc5Id,
        appointment_time: getRelativeISTTimestamp(-4, '15:00'),
        reason: 'Wrist strain after badminton',
        status: 'Completed',
        notes: 'Recommended ergonomic wrist brace & 5 days rest.',
      },
      {
        id: 'appt-105',
        patient_id: pat2Id,
        patient_phone: '9845011223',
        patient_email: 'meera.nair@demo.com',
        doctor_id: doc1Id,
        appointment_time: getRelativeISTTimestamp(0, '14:00'),
        reason: 'Palpitations and fatigue review',
        status: 'Awaiting Doctor',
        notes: '',
      },
      {
        id: 'appt-106',
        patient_id: pat3Id,
        patient_phone: '9900112233',
        patient_email: 'rohan.d@demo.com',
        doctor_id: doc1Id,
        appointment_time: getRelativeISTTimestamp(0, '11:00'),
        reason: 'Hypertension medication review',
        status: 'Confirmed',
        notes: '',
      },
      {
        id: 'appt-107',
        patient_id: pat2Id,
        patient_phone: '9845011223',
        patient_email: 'meera.nair@demo.com',
        doctor_id: doc1Id,
        appointment_time: getRelativeISTTimestamp(-2, '10:00'),
        reason: 'Post-stress echo evaluation',
        status: 'Completed',
        notes: 'Normal sinus rhythm; continue daily 30m walk.',
      },
    ],
  }
}

function loadDb(): DemoDatabase {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as DemoDatabase
      if (parsed && Array.isArray(parsed.patients) && Array.isArray(parsed.doctors) && Array.isArray(parsed.appointments)) {
        return parsed
      }
    }
  } catch {
    // ignore corrupted storage
  }
  const seed = createInitialSeed()
  saveDb(seed)
  return seed
}

function saveDb(db: DemoDatabase) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch {
    // ignore storage quota errors
  }
}

type TableName = keyof DemoDatabase

class MockQueryBuilder {
  private table: TableName
  private filters: ((row: Row) => boolean)[] = []
  private orderField: string | null = null
  private orderAsc = true
  private selectClause = '*'
  private expectSingle = false
  private mode: 'select' | 'insert' | 'update' = 'select'
  private payload: Row | Row[] | null = null
  private returnData = false

  constructor(table: TableName) {
    this.table = table
  }

  select(columns = '*') {
    if (this.mode !== 'select') {
      this.returnData = true
    } else {
      this.selectClause = columns
    }
    return this
  }

  insert(values: Row | Row[]) {
    this.mode = 'insert'
    this.payload = values
    return this
  }

  update(values: Row) {
    this.mode = 'update'
    this.payload = values
    return this
  }

  eq(col: string, val: any) {
    this.filters.push((row) => String(row[col]) === String(val))
    return this
  }

  neq(col: string, val: any) {
    this.filters.push((row) => String(row[col]) !== String(val))
    return this
  }

  or(expr: string) {
    const parts = expr.split(',').map((p) => p.trim())
    this.filters.push((row) =>
      parts.some((part) => {
        const match = part.match(/^([^.]+)\.eq\.(.+)$/)
        if (!match) return false
        const [, col, val] = match
        return String(row[col] ?? '') === String(val)
      })
    )
    return this
  }

  order(col: string, opts?: { ascending?: boolean }) {
    this.orderField = col
    this.orderAsc = opts?.ascending !== false
    return this
  }

  single() {
    this.expectSingle = true
    return this
  }

  private enrichRow(row: Row, db: DemoDatabase): Row {
    const copy = { ...row }
    if (this.table === 'appointments' && this.selectClause.includes('doctors(')) {
      const doc = db.doctors.find((d) => d.id === row.doctor_id) || null
      copy.doctors = doc ? { ...doc } : null
    }
    return copy
  }

  private execute(): { data: any; error: any } {
    const db = loadDb()
    const rows = db[this.table]

    if (this.mode === 'insert') {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload || {}]
      const inserted: Row[] = []
      for (const item of items) {
        if (this.table === 'appointments') {
          const conflict = db.appointments.find(
            (a) =>
              a.doctor_id === item.doctor_id &&
              a.appointment_time === item.appointment_time &&
              a.status !== 'Cancelled'
          )
          if (conflict) {
            return { data: null, error: { code: '23505', message: 'Slot already booked.' } }
          }
        }
        const newRow: Row = {
          id: item.id || `${this.table.slice(0, 3)}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          ...item,
        }
        rows.push(newRow)
        inserted.push(newRow)
      }
      saveDb(db)
      const result = this.expectSingle ? inserted[0] ?? null : inserted
      return { data: this.returnData ? result : null, error: null }
    }

    if (this.mode === 'update') {
      const matched = rows.filter((r) => this.filters.every((fn) => fn(r)))
      const updateFields = (this.payload as Row) || {}

      if (this.table === 'appointments' && updateFields.appointment_time) {
        for (const target of matched) {
          const conflict = db.appointments.find(
            (a) =>
              a.id !== target.id &&
              a.doctor_id === target.doctor_id &&
              a.appointment_time === updateFields.appointment_time &&
              a.status !== 'Cancelled'
          )
          if (conflict) {
            return { data: null, error: { code: '23505', message: 'Slot already booked.' } }
          }
        }
      }

      matched.forEach((r) => Object.assign(r, updateFields))
      saveDb(db)
      const result = this.expectSingle ? matched[0] ?? null : matched
      return { data: this.returnData ? result : null, error: null }
    }

    let result = rows.filter((r) => this.filters.every((fn) => fn(r)))
    if (this.orderField) {
      const col = this.orderField
      const asc = this.orderAsc
      result = [...result].sort((a, b) => {
        const av = String(a[col] ?? '')
        const bv = String(b[col] ?? '')
        return asc ? av.localeCompare(bv) : bv.localeCompare(av)
      })
    }

    const enriched = result.map((r) => this.enrichRow(r, db))
    if (this.expectSingle) {
      if (enriched.length === 0) {
        return { data: null, error: { code: 'PGRST116', message: 'No matching record found' } }
      }
      return { data: enriched[0], error: null }
    }
    return { data: enriched, error: null }
  }

  then<TResult1 = { data: any; error: any }, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: any }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected)
  }
}

function createDemoClient() {
  console.info('[CareConnect] Running in local interactive demo mode (set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env for live Supabase).')
  return {
    from(table: TableName) {
      return new MockQueryBuilder(table)
    },
  } as unknown as SupabaseClient
}

export const supabase: SupabaseClient = hasValidEnv
  ? createClient(url!, anonKey!)
  : createDemoClient()