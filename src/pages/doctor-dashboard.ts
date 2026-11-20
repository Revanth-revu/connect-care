import { supabase } from '../supabase'
import { showToast, escapeHtml } from './toast'

const listContainer = document.getElementById('doctor-appointments') as HTMLDivElement
const liveClockEl = document.getElementById('live-clock') as HTMLSpanElement
const doctorGreetingEl = document.getElementById('doctor-greeting') as HTMLParagraphElement
const availabilityToggle = document.getElementById('availability-toggle') as HTMLButtonElement
const availabilityLabelEl = document.getElementById('availability-label') as HTMLSpanElement
const docProfileStatusPill = document.getElementById('doc-profile-status-pill') as HTMLDivElement
const docProfileStatusText = document.getElementById('doc-profile-status-text') as HTMLSpanElement

const docAvatarEl = document.getElementById('doc-avatar') as HTMLDivElement
const docNameEl = document.getElementById('doc-name') as HTMLHeadingElement
const docSpecialtyEl = document.getElementById('doc-specialty') as HTMLParagraphElement
const docClinicEl = document.getElementById('doc-clinic') as HTMLSpanElement
const docFeeEl = document.getElementById('doc-fee') as HTMLSpanElement
const docEducationEl = document.getElementById('doc-education') as HTMLSpanElement
const docAreaEl = document.getElementById('doc-area') as HTMLSpanElement
const slotUtilText = document.getElementById('slot-util-text') as HTMLElement
const slotUtilBar = document.getElementById('slot-util-bar') as HTMLDivElement
const todayTimelineEl = document.getElementById('today-timeline') as HTMLDivElement
const todayDateLabelEl = document.getElementById('today-date-label') as HTMLSpanElement

const kpiPending = document.getElementById('kpi-pending') as HTMLDivElement
const kpiConfirmed = document.getElementById('kpi-confirmed') as HTMLDivElement
const kpiConfirmedSub = document.getElementById('kpi-confirmed-sub') as HTMLSpanElement
const kpiCompleted = document.getElementById('kpi-completed') as HTMLDivElement
const kpiRevenue = document.getElementById('kpi-revenue') as HTMLDivElement
const kpiFeeSub = document.getElementById('kpi-fee-sub') as HTMLSpanElement

const queueTotalLabel = document.getElementById('queue-total-label') as HTMLSpanElement
const searchInput = document.getElementById('doctor-search') as HTMLInputElement

const dcntAll = document.getElementById('dcnt-all') as HTMLSpanElement
const dcntAwaiting = document.getElementById('dcnt-awaiting') as HTMLSpanElement
const dcntConfirmed = document.getElementById('dcnt-confirmed') as HTMLSpanElement
const dcntCompleted = document.getElementById('dcnt-completed') as HTMLSpanElement
const dcntCancelled = document.getElementById('dcnt-cancelled') as HTMLSpanElement

const doctorId = sessionStorage.getItem('doctor_id')
if (!doctorId) {
  window.location.href = './login-doctor.html'
}

let doctorProfile = {
  name: sessionStorage.getItem('doctor_name') || 'Doctor',
  specialty: sessionStorage.getItem('doctor_specialty') || 'Specialist Consultation',
  clinic_name: sessionStorage.getItem('doctor_clinic') || 'CareConnect Clinic',
  area: sessionStorage.getItem('doctor_area') || 'Bengaluru',
  education: sessionStorage.getItem('doctor_education') || 'MBBS, MD',
  consultation_fee: Number(sessionStorage.getItem('doctor_fee') || '800'),
}

let isAccepting = true
let currentFilter = 'All'
let searchQuery = ''
let appointmentsCache: any[] = []
let patientsCache: any[] = []
let activeNotesApptId: string | null = null
let activeNotesMarkCompleted = true
let activeTeleAppt: any = null
let pendingDeclineId: string | null = null

const SLOT_HOURS = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00']

function updateClock() {
  const now = new Date()
  const istStr = now.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
  liveClockEl.textContent = `${istStr.toUpperCase()} IST`
}
updateClock()
setInterval(updateClock, 30000)

function openModal(id: string) {
  const el = document.getElementById(id)
  if (el) el.style.display = 'flex'
}
function closeModal(id: string) {
  const el = document.getElementById(id)
  if (el) el.style.display = 'none'
}

document.querySelectorAll('[data-close-modal]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const id = btn.getAttribute('data-close-modal')
    if (id) closeModal(id)
  })
})

document.getElementById('logout-btn')?.addEventListener('click', () => {
  sessionStorage.clear()
  window.location.href = '/'
})

function applyAvailabilityUI(available: boolean) {
  isAccepting = available
  availabilityToggle.setAttribute('aria-checked', String(available))
  if (available) {
    availabilityToggle.classList.remove('is-unavailable')
    availabilityLabelEl.textContent = 'Available'
    docProfileStatusPill.classList.remove('is-unavailable')
    docProfileStatusText.textContent = 'Available for Bookings'
  } else {
    availabilityToggle.classList.add('is-unavailable')
    availabilityLabelEl.textContent = 'Unavailable'
    docProfileStatusPill.classList.add('is-unavailable')
    docProfileStatusText.textContent = 'Currently Unavailable'
  }
}

const storedAvailability = doctorId ? localStorage.getItem(`careconnect_doc_availability_${doctorId}`) : null
if (storedAvailability !== null) {
  applyAvailabilityUI(storedAvailability === 'true')
} else {
  applyAvailabilityUI(true)
}

availabilityToggle.addEventListener('click', async () => {
  const nextState = !isAccepting
  applyAvailabilityUI(nextState)
  if (doctorId) {
    localStorage.setItem(`careconnect_doc_availability_${doctorId}`, String(nextState))
    await supabase.from('doctors').update({ is_available: nextState }).eq('id', doctorId)
  }
  showToast(
    nextState ? 'Status updated: Available for Patients' : 'Status updated: Unavailable',
    nextState ? 'success' : 'info'
  )
})

function renderDoctorProfile() {
  docNameEl.textContent = doctorProfile.name
  docSpecialtyEl.textContent = doctorProfile.specialty
  docClinicEl.textContent = doctorProfile.clinic_name
  docFeeEl.textContent = `₹${doctorProfile.consultation_fee}`
  docEducationEl.textContent = doctorProfile.education
  docAreaEl.textContent = doctorProfile.area
  doctorGreetingEl.textContent = `${doctorProfile.name} • ${doctorProfile.clinic_name}`
  kpiFeeSub.textContent = `@ ₹${doctorProfile.consultation_fee} / consultation`

  const cleanName = doctorProfile.name.replace(/^Dr\.\s*/i, '')
  const initials = cleanName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() || '')
    .join('')
  docAvatarEl.textContent = initials || 'DR'
}

function getStatusColor(status: string): string {
  if (status === 'Confirmed') return '#4ade80'
  if (status === 'Awaiting Doctor') return '#eab308'
  if (status === 'Completed') return '#3b82f6'
  if (status === 'Cancelled') return '#888888'
  return '#ef4444'
}

function renderTodayTimeline() {
  const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  todayDateLabelEl.textContent = new Date().toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })

  const todayActive = appointmentsCache.filter((a) => {
    if (a.status === 'Cancelled') return false
    const d = new Date(a.appointment_time).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
    return d === todayIST
  })

  const bookedCount = todayActive.length
  const pct = Math.min(100, Math.round((bookedCount / SLOT_HOURS.length) * 100))
  slotUtilText.textContent = `${bookedCount} / ${SLOT_HOURS.length} slots`
  slotUtilBar.style.width = `${pct}%`

  todayTimelineEl.innerHTML = ''
  SLOT_HOURS.forEach((slot) => {
    const match = todayActive.find((a) => {
      const hm = new Date(a.appointment_time).toLocaleTimeString('en-GB', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
      return hm === slot
    })

    const pill = document.createElement('div')
    let cls = 'cc-slot-pill'
    let label = 'Open'
    if (match) {
      if (match.status === 'Awaiting Doctor') {
        cls += ' pending'
        label = 'Pending'
      } else {
        cls += ' booked'
        label = match.status === 'Completed' ? 'Done' : 'Booked'
      }
    }
    pill.className = cls
    pill.innerHTML = `<span>${slot}</span><strong>${label}</strong>`
    todayTimelineEl.appendChild(pill)
  })
}

function renderKpis() {
  const pending = appointmentsCache.filter((a) => a.status === 'Awaiting Doctor')
  const confirmed = appointmentsCache.filter((a) => a.status === 'Confirmed')
  const completed = appointmentsCache.filter((a) => a.status === 'Completed')
  const cancelled = appointmentsCache.filter((a) => a.status === 'Cancelled')

  kpiPending.textContent = String(pending.length)
  kpiConfirmed.textContent = String(confirmed.length)
  kpiCompleted.textContent = String(completed.length)

  const totalRevenue = (confirmed.length + completed.length) * doctorProfile.consultation_fee
  kpiRevenue.textContent = `₹${totalRevenue.toLocaleString('en-IN')}`

  if (confirmed.length > 0) {
    const nextConf = confirmed[0]
    const formatted = new Date(nextConf.appointment_time).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    })
    kpiConfirmedSub.textContent = `Next: ${formatted}`
  } else {
    kpiConfirmedSub.textContent = 'No confirmed visits queued'
  }

  dcntAll.textContent = String(appointmentsCache.length)
  dcntAwaiting.textContent = String(pending.length)
  dcntConfirmed.textContent = String(confirmed.length)
  dcntCompleted.textContent = String(completed.length)
  dcntCancelled.textContent = String(cancelled.length)
  queueTotalLabel.textContent = `${appointmentsCache.length} total`
}

function renderQueue() {
  const filtered = appointmentsCache.filter((appt) => {
    const matchesTab = currentFilter === 'All' || appt.status === currentFilter
    if (!matchesTab) return false
    if (!searchQuery) return true

    const pat = patientsCache.find((p) => p.phone === appt.patient_phone)
    const haystack = [
      pat?.name || '',
      appt.patient_phone || '',
      appt.patient_email || '',
      appt.reason || '',
      appt.status || '',
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(searchQuery)
  })

  listContainer.innerHTML = ''

  if (filtered.length === 0) {
    listContainer.innerHTML = `
      <div style="text-align: center; padding: 36px 20px; border: 1px dashed rgba(148,163,184,0.28); border-radius: 16px;">
        <p style="color: #cbd5e1; margin: 0;">No appointments in this category.</p>
      </div>
    `
    return
  }

  filtered.forEach((appt) => {
    const pat = patientsCache.find((p) => p.phone === appt.patient_phone)
    const patientName = pat?.name || `Patient (+91 ${appt.patient_phone})`
    const patientGender = pat?.gender || 'Not specified'
    const badgeColor = getStatusColor(appt.status)

    const localTime = new Date(appt.appointment_time).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    })

    let actionButtons = ''
    if (appt.status === 'Awaiting Doctor') {
      actionButtons = `
        <button type="button" class="btn-neon-teal" data-accept-id="${escapeHtml(appt.id)}">
          ✓ Accept Appointment
        </button>
        <button type="button" class="btn-neon-red" data-decline-id="${escapeHtml(appt.id)}">
          Decline
        </button>
      `
    } else if (appt.status === 'Confirmed') {
      actionButtons = `
        <button type="button" class="btn-neon-teal" data-tele-id="${escapeHtml(appt.id)}">
          🎥 Join Teleconsult
        </button>
        <button type="button" class="btn-neon-blue" data-complete-id="${escapeHtml(appt.id)}">
          ✓ Mark Completed
        </button>
      `
    } else if (appt.status === 'Completed') {
      actionButtons = `
        <button type="button" class="btn-neon-ghost" data-editnotes-id="${escapeHtml(appt.id)}">
          ✎ ${appt.notes ? 'Edit Clinical Notes' : 'Add Clinical Notes'}
        </button>
      `
    }

    const card = document.createElement('div')
    card.className = 'cc-appt-card indigo'
    card.innerHTML = `
      <div class="cc-appt-top">
        <div>
          <h3 class="cc-appt-title">
            <span>${escapeHtml(patientName)}</span>
            <span style="font-size: 0.72rem; font-weight: 500; padding: 2px 9px; border-radius: 99px; background: rgba(124, 77, 255, 0.16); color: #c4b5fd; border: 1px solid rgba(124, 77, 255, 0.35);">
              ${escapeHtml(patientGender)}
            </span>
          </h3>
          <p class="cc-appt-sub">+91 ${escapeHtml(appt.patient_phone || '')} • ${escapeHtml(appt.patient_email || 'No email')}</p>
        </div>
        <span class="status-badge" style="background: ${badgeColor}20; color: ${badgeColor}; border: 1px solid ${badgeColor}45;">
          ${escapeHtml(appt.status)}
        </span>
      </div>

      <div class="cc-appt-meta">
        <span>📅 <strong>${escapeHtml(localTime)} IST</strong></span>
        <span>🩺 Reason: <strong>${escapeHtml(appt.reason || 'General Consultation')}</strong></span>
      </div>

      ${appt.notes ? `<div class="cc-appt-notes"><strong>Clinical Notes:</strong> ${escapeHtml(appt.notes)}</div>` : ''}
      ${actionButtons ? `<div class="cc-appt-actions">${actionButtons}</div>` : ''}
    `
    listContainer.appendChild(card)
  })

  attachQueueHandlers()
}

function attachQueueHandlers() {
  listContainer.querySelectorAll('[data-accept-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-accept-id')
      if (id) updateStatus(id, 'Confirmed')
    })
  })

  listContainer.querySelectorAll('[data-decline-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      pendingDeclineId = btn.getAttribute('data-decline-id')
      openModal('decline-modal')
    })
  })

  listContainer.querySelectorAll('[data-complete-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-complete-id')
      if (id) openNotesModal(id, true)
    })
  })

  listContainer.querySelectorAll('[data-editnotes-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-editnotes-id')
      if (id) openNotesModal(id, false)
    })
  })

  listContainer.querySelectorAll('[data-tele-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-tele-id')
      const appt = appointmentsCache.find((a) => a.id === id)
      if (!appt) return
      activeTeleAppt = appt
      const pat = patientsCache.find((p) => p.phone === appt.patient_phone)
      ;(document.getElementById('tele-patient-name') as HTMLElement).textContent = pat?.name || `+91 ${appt.patient_phone}`
      ;(document.getElementById('tele-patient-meta') as HTMLElement).textContent =
        `${appt.reason || 'General Consultation'} • +91 ${appt.patient_phone}`
      openModal('teleconsult-modal')
    })
  })
}

function openNotesModal(apptId: string, markCompleted: boolean) {
  const appt = appointmentsCache.find((a) => a.id === apptId)
  if (!appt) return
  activeNotesApptId = apptId
  activeNotesMarkCompleted = markCompleted
  const pat = patientsCache.find((p) => p.phone === appt.patient_phone)

  ;(document.getElementById('notes-modal-title') as HTMLElement).textContent = markCompleted
    ? 'Complete Consultation'
    : 'Edit Clinical Notes'
  ;(document.getElementById('notes-patient-label') as HTMLElement).textContent =
    `Patient: ${pat?.name || '+91 ' + appt.patient_phone} • ${appt.reason || 'Consultation'}`
  ;(document.getElementById('consultation-notes') as HTMLTextAreaElement).value = appt.notes || ''
  ;(document.getElementById('save-notes-btn') as HTMLButtonElement).textContent = markCompleted
    ? 'Save & Mark Completed'
    : 'Save Notes'

  openModal('notes-modal')
}

document.getElementById('save-notes-btn')?.addEventListener('click', async () => {
  if (!activeNotesApptId) return
  const targetId = activeNotesApptId
  const notes = (document.getElementById('consultation-notes') as HTMLTextAreaElement).value.trim()

  if (activeNotesMarkCompleted) {
    const { error: statusErr } = await supabase
      .from('appointments')
      .update({ status: 'Completed' })
      .eq('id', targetId)
      .select()

    if (statusErr) {
      showToast(`Failed to complete appointment: ${statusErr.message}`, 'error')
      return
    }
  }

  if (notes || !activeNotesMarkCompleted) {
    const { error: notesErr } = await supabase
      .from('appointments')
      .update({ notes })
      .eq('id', targetId)
      .select()

    if (notesErr && !activeNotesMarkCompleted) {
      showToast(`Note could not be saved to database: ${notesErr.message}`, 'error')
      return
    }
  }

  closeModal('notes-modal')
  activeNotesApptId = null
  showToast(activeNotesMarkCompleted ? 'Consultation marked as Completed!' : 'Clinical notes updated!', 'success')
  loadDoctorSchedule()
})

document.getElementById('tele-complete-btn')?.addEventListener('click', () => {
  if (!activeTeleAppt) return
  const id = activeTeleAppt.id
  closeModal('teleconsult-modal')
  openNotesModal(id, true)
})

document.getElementById('confirm-decline-btn')?.addEventListener('click', async () => {
  if (!pendingDeclineId) return
  const id = pendingDeclineId
  pendingDeclineId = null
  closeModal('decline-modal')
  await updateStatus(id, 'Cancelled')
})

async function updateStatus(id: string, newStatus: string) {
  const { data, error } = await supabase
    .from('appointments')
    .update({ status: newStatus })
    .eq('id', id)
    .select()

  if (error) {
    showToast(`Error updating status: ${error.message}`, 'error')
  } else if (data && data.length === 0) {
    showToast('Failed to update. Database permissions might be missing.', 'error')
  } else {
    showToast(`Appointment ${newStatus.toLowerCase()}!`, newStatus === 'Cancelled' ? 'info' : 'success')
    loadDoctorSchedule()
  }
}

document.querySelectorAll('#doctor-filter-tabs .cc-filter-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('#doctor-filter-tabs .cc-filter-tab').forEach((t) => t.classList.remove('active'))
    tab.classList.add('active')
    currentFilter = tab.getAttribute('data-filter') || 'All'
    renderQueue()
  })
})

searchInput.addEventListener('input', () => {
  searchQuery = searchInput.value.trim().toLowerCase()
  renderQueue()
})

async function loadDoctorSchedule() {
  const [{ data: appts, error }, { data: patients }, { data: docRecord }] = await Promise.all([
    supabase
      .from('appointments')
      .select('*')
      .eq('doctor_id', doctorId)
      .order('appointment_time', { ascending: true }),
    supabase.from('patients').select('phone, gender, name'),
    supabase.from('doctors').select('*').eq('id', doctorId).single(),
  ])

  if (error) {
    listContainer.innerHTML = `<p class="error">Error: ${escapeHtml(error.message)}</p>`
    return
  }

  if (docRecord) {
    doctorProfile = {
      name: docRecord.name || doctorProfile.name,
      specialty: docRecord.specialty || doctorProfile.specialty,
      clinic_name: docRecord.clinic_name || doctorProfile.clinic_name,
      area: docRecord.area || doctorProfile.area,
      education: docRecord.education || doctorProfile.education,
      consultation_fee: Number(docRecord.consultation_fee || doctorProfile.consultation_fee),
    }
    if (typeof docRecord.is_available === 'boolean') {
      applyAvailabilityUI(docRecord.is_available)
      if (doctorId) {
        localStorage.setItem(`careconnect_doc_availability_${doctorId}`, String(docRecord.is_available))
      }
    }
  }

  renderDoctorProfile()
  appointmentsCache = appts || []
  patientsCache = patients || []

  renderKpis()
  renderTodayTimeline()
  renderQueue()
}

loadDoctorSchedule()