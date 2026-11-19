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
    listEl.innerHTML = `<div class="glass-panel"><p style="color: #aaa; text-align: center; margin: 0;">No doctors match your search criteria.</p></div>`
    return
  }

  doctorsToRender.forEach((doc) => {
    const card = document.createElement('div')
    card.className = 'appointment-card'
    card.style.cursor = 'pointer'
    card.style.marginBottom = '0'

    const availabilityColor = doc.availableToday > 0 ? '#4ade80' : '#ef4444'
    const availabilityText = doc.availableToday > 0
      ? `${doc.availableToday} slots left today`
      : 'Fully booked today'
    const feeText = doc.consultation_fee ? `₹${doc.consultation_fee}` : '₹500'

    card.innerHTML = `
      <div class="appointment-header" style="align-items: flex-start;">
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 6px;">
            <h3 style="margin: 0; color: #fff;">${escapeHtml(doc.name)} <span style="font-size: 0.8rem; color: #888; font-weight: 400;">(${escapeHtml(doc.gender || 'N/A')})</span></h3>
            <span style="font-size: 0.72rem; background: rgba(255,255,255,0.08); padding: 2px 9px; border-radius: 10px; color: #ddd;">${escapeHtml(doc.education || 'MBBS')}</span>
          </div>

          <p style="color: #00BFA5; font-weight: 600; font-size: 0.9rem; margin-bottom: 4px;">${escapeHtml(doc.specialty)} • ${escapeHtml(doc.experience || 'Experienced')}</p>
          <p style="font-size: 0.88rem; color: #ddd; margin-bottom: 4px;">${escapeHtml(doc.clinic_name)}</p>
          <p style="color:#888; font-size:0.83rem;">📍 ${escapeHtml(doc.area)}</p>
        </div>
        <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
          <div style="background: rgba(0, 137, 123, 0.2); min-width: 44px; height: 44px; border-radius: 50%; display: flex; justify-content: center; align-items: center; border: 1px solid #00897B; box-shadow: 0 0 10px rgba(0, 137, 123, 0.3);">
            🩺
          </div>
          <span style="font-family: 'Outfit', sans-serif; font-weight: 700; color: #00BFA5; font-size: 1rem;">${feeText}</span>
        </div>
      </div>

      <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; font-size: 0.83rem;">
        <span style="color: #aaa;">Total Consultations: <strong style="color: #fff;">${doc.totalBooked}</strong></span>
        <span style="color: ${availabilityColor}; font-weight: 500;">● ${availabilityText}</span>
      </div>
    `

    if (selectedId === doc.id) {
      card.style.borderColor = '#00BFA5'
      card.style.boxShadow = '0 0 20px rgba(0, 191, 165, 0.3)'
    }

    card.onclick = () => {
      document.querySelectorAll('#doctor-list .appointment-card').forEach((el) => {
        ;(el as HTMLElement).style.borderColor = 'rgba(255, 255, 255, 0.1)'
        ;(el as HTMLElement).style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.4)'
      })
      card.style.borderColor = '#00BFA5'
      card.style.boxShadow = '0 0 22px rgba(0, 191, 165, 0.32)'

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

loadDoctors()