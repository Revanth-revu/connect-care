import { supabase } from '../supabase'
import { escapeHtml } from './toast'

const patientPhone = sessionStorage.getItem('patient_phone')
if (!patientPhone) {
  window.location.href = './login-patient.html'
}

sessionStorage.removeItem('reschedule_id')

const listEl = document.getElementById('doctor-list') as HTMLDivElement
const continueBtn = document.getElementById('continue-btn') as HTMLButtonElement
const filterSelect = document.getElementById('specialty-filter') as HTMLSelectElement
const searchInput = document.getElementById('doctor-search') as HTMLInputElement

type Doctor = {
  id: string
  name: string
  specialty: string
  clinic_name: string
  area: string
  experience: string
  education: string
  gender: string
  consultation_fee?: number
  is_available?: boolean
}

type Appointment = {
  doctor_id: string
  appointment_time: string
  status: string
}

type DoctorWithStats = Doctor & {
  totalBooked: number
  availableToday: number
}

let allDoctors: DoctorWithStats[] = []
let selectedId: string | null = null

function getTodayIST() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}

function applyFilters() {
  const selectedSpecialty = filterSelect.value
  const q = searchInput.value.trim().toLowerCase()

  const filtered = allDoctors.filter((doc) => {
    const matchesSpec = selectedSpecialty === 'All' || doc.specialty === selectedSpecialty
    const matchesQuery =
      !q ||
      doc.name.toLowerCase().includes(q) ||
      doc.specialty.toLowerCase().includes(q) ||
      doc.clinic_name.toLowerCase().includes(q) ||
      doc.area.toLowerCase().includes(q)
    return matchesSpec && matchesQuery
  })

  renderDoctors(filtered)
}

function renderDoctors(doctorsToRender: DoctorWithStats[]) {
  listEl.innerHTML = ''

  if (doctorsToRender.length === 0) {
    listEl.innerHTML = `<div class="glass-panel"><p style="color: #cbd5e1; text-align: center; margin: 0;">No doctors match your search criteria.</p></div>`
    return
  }

  doctorsToRender.forEach((doc) => {
    const card = document.createElement('div')
    card.className = 'appointment-card'
    card.style.cursor = 'pointer'
    card.style.marginBottom = '0'

    const localAvail = localStorage.getItem(`careconnect_doc_availability_${doc.id}`)
    const effectiveAvailable =
      typeof doc.is_available === 'boolean'
        ? doc.is_available
        : localAvail === 'false'
          ? false
          : true
    const isManuallyUnavailable = !effectiveAvailable
    const availabilityColor = isManuallyUnavailable
      ? '#f87171'
      : doc.availableToday > 0
        ? '#4ade80'
        : '#f87171'
    const availabilityText = isManuallyUnavailable
      ? 'Unavailable right now'
      : doc.availableToday > 0
        ? `Available · ${doc.availableToday} slots left today`
        : 'Fully booked today'
    const feeText = doc.consultation_fee ? `₹${doc.consultation_fee}` : '₹500'

    card.innerHTML = `
      <div class="appointment-header" style="align-items: flex-start;">
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 6px;">
            <h3 style="margin: 0; color: #fff;">${escapeHtml(doc.name)} <span style="font-size: 0.82rem; color: #cbd5e1; font-weight: 400;">(${escapeHtml(doc.gender || 'N/A')})</span></h3>
            <span style="font-size: 0.74rem; background: rgba(148,163,184,0.18); border: 1px solid rgba(148,163,184,0.3); padding: 2px 9px; border-radius: 10px; color: #f1f5f9;">${escapeHtml(doc.education || 'MBBS')}</span>
          </div>

          <p style="color: #2dd4bf; font-weight: 600; font-size: 0.92rem; margin-bottom: 4px;">${escapeHtml(doc.specialty)} • ${escapeHtml(doc.experience || 'Experienced')}</p>
          <p style="font-size: 0.9rem; color: #f1f5f9; margin-bottom: 4px;">${escapeHtml(doc.clinic_name)}</p>
          <p style="color: #cbd5e1; font-size: 0.85rem;">📍 ${escapeHtml(doc.area)}</p>
        </div>
        <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
          <div style="background: rgba(0, 150, 136, 0.28); min-width: 44px; height: 44px; border-radius: 50%; display: flex; justify-content: center; align-items: center; border: 1.5px solid #2dd4bf; box-shadow: 0 0 12px rgba(0, 191, 165, 0.3);">
            🩺
          </div>
          <span style="font-family: 'Outfit', sans-serif; font-weight: 700; color: #2dd4bf; font-size: 1.05rem;">${feeText}</span>
        </div>
      </div>

      <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(148,163,184,0.2); display: flex; justify-content: space-between; font-size: 0.85rem;">
        <span style="color: #cbd5e1;">Total Consultations: <strong style="color: #fff;">${doc.totalBooked}</strong></span>
        <span style="color: ${availabilityColor}; font-weight: 600;">● ${availabilityText}</span>
      </div>
    `

    if (selectedId === doc.id) {
      card.style.borderColor = '#2dd4bf'
      card.style.boxShadow = '0 0 22px rgba(45, 212, 191, 0.35)'
    }

    card.onclick = () => {
      document.querySelectorAll('#doctor-list .appointment-card').forEach((el) => {
        ;(el as HTMLElement).style.borderColor = 'rgba(148, 163, 184, 0.24)'
        ;(el as HTMLElement).style.boxShadow = '0 10px 26px rgba(0, 0, 0, 0.45)'
      })
      card.style.borderColor = '#2dd4bf'
      card.style.boxShadow = '0 0 24px rgba(45, 212, 191, 0.36)'

      selectedId = doc.id
      continueBtn.disabled = false
    }

    listEl.appendChild(card)
  })
}

async function loadDoctors() {
  const { data: doctors, error: docError } = await supabase.from('doctors').select('*').order('name')

  if (docError) {
    listEl.innerHTML = `<p class="error">Failed to load doctors: ${escapeHtml(docError.message)}</p>`
    return
  }

  const { data: appointments } = await supabase.from('appointments').select('doctor_id, appointment_time, status')

  const todayIST = getTodayIST()
  const MAX_SLOTS_PER_DAY = 8

  allDoctors = (doctors as Doctor[]).map((doc) => {
    const docAppts = (appointments as Appointment[])?.filter((a) => a.doctor_id === doc.id && a.status !== 'Cancelled') || []
    const totalBooked = docAppts.length
    const apptsToday = docAppts.filter((a) => {
      const apptDate = new Date(a.appointment_time).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
      return apptDate === todayIST
    }).length

    const availableToday = Math.max(0, MAX_SLOTS_PER_DAY - apptsToday)
    return { ...doc, totalBooked, availableToday }
  })

  const specialties = [...new Set(allDoctors.map((doc) => doc.specialty))].sort()
  specialties.forEach((specialty) => {
    const option = document.createElement('option')
    option.value = specialty
    option.textContent = specialty
    filterSelect.appendChild(option)
  })

  const urlSpec = new URLSearchParams(window.location.search).get('specialty')
  if (urlSpec && specialties.includes(urlSpec)) {
    filterSelect.value = urlSpec
  }

  applyFilters()
}

filterSelect.addEventListener('change', applyFilters)
searchInput.addEventListener('input', applyFilters)

continueBtn.addEventListener('click', () => {
  if (!selectedId) return
  sessionStorage.setItem('doctor_id', selectedId)
  window.location.href = './booking.html'
})

window.addEventListener('storage', (e) => {
  if (
    e.key === 'careconnect_demo_db_v1' ||
    (e.key && e.key.startsWith('careconnect_doc_availability_'))
  ) {
    loadDoctors()
  }
})

loadDoctors()