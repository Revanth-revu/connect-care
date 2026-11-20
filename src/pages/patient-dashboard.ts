import { supabase } from '../supabase'
import { showToast, escapeHtml } from './toast'

const displayName = document.getElementById('display-name') as HTMLHeadingElement
const displayPhone = document.getElementById('display-phone') as HTMLSpanElement
const displayEmail = document.getElementById('display-email') as HTMLSpanElement
const displayGender = document.getElementById('display-gender') as HTMLSpanElement
const profileAvatar = document.getElementById('profile-avatar') as HTMLDivElement
const greetingText = document.getElementById('greeting-text') as HTMLParagraphElement
const liveClockEl = document.getElementById('live-clock') as HTMLSpanElement
const listContainer = document.getElementById('appointments-list') as HTMLDivElement

const kpiConfirmed = document.getElementById('kpi-confirmed') as HTMLDivElement
const kpiConfirmedSub = document.getElementById('kpi-confirmed-sub') as HTMLSpanElement
const kpiAwaiting = document.getElementById('kpi-awaiting') as HTMLDivElement
const kpiWallet = document.getElementById('kpi-wallet') as HTMLDivElement
const kpiUnpaid = document.getElementById('kpi-unpaid') as HTMLDivElement
const kpiUnpaidSub = document.getElementById('kpi-unpaid-sub') as HTMLSpanElement

const spotlightBody = document.getElementById('spotlight-body') as HTMLDivElement
const spotlightBadge = document.getElementById('spotlight-badge') as HTMLSpanElement
const apptTotalLabel = document.getElementById('appt-total-label') as HTMLSpanElement
const searchInput = document.getElementById('patient-search') as HTMLInputElement

const cntAll = document.getElementById('cnt-all') as HTMLSpanElement
const cntUpcoming = document.getElementById('cnt-upcoming') as HTMLSpanElement
const cntUnpaid = document.getElementById('cnt-unpaid') as HTMLSpanElement
const cntCompleted = document.getElementById('cnt-completed') as HTMLSpanElement
const cntCancelled = document.getElementById('cnt-cancelled') as HTMLSpanElement

const patientPhone = sessionStorage.getItem('patient_phone')
let patientName = sessionStorage.getItem('patient_name') || 'CareConnect Patient'
let patientEmail = sessionStorage.getItem('patient_email') || 'Not provided'
let patientGender = sessionStorage.getItem('patient_gender') || 'Not specified'

if (!patientPhone) {
  window.location.href = './login-patient.html'
}

let currentFilter = 'All'
let searchQuery = ''
let walletBalance = 0
let appointmentsCache: any[] = []
let doctorsCache: any[] = []
let pendingCancelId: string | null = null

function updateClockAndGreeting() {
  const now = new Date()
  const istStr = now.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
  liveClockEl.textContent = `${istStr.toUpperCase()} IST`

  const hour = Number(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false }))
  const salutation = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  greetingText.textContent = `${salutation}, ${patientName.split(' ')[0]} · Bengaluru Health Network`
}

function renderProfile() {
  displayName.textContent = patientName
  displayPhone.textContent = patientPhone || ''
  displayEmail.textContent = patientEmail || 'Not provided'
  displayGender.textContent = patientGender || 'Not specified'
  const initials = patientName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() || '')
    .join('')
  profileAvatar.textContent = initials || 'CC'
  updateClockAndGreeting()
}

renderProfile()
setInterval(updateClockAndGreeting, 30000)

// Modal wiring
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

// Wallet Top-Up
document.getElementById('kpi-topup-btn')?.addEventListener('click', () => openModal('topup-modal'))
document.getElementById('profile-topup-btn')?.addEventListener('click', () => openModal('topup-modal'))
document.querySelectorAll('.quick-topup-amt').forEach((btn) => {
  btn.addEventListener('click', () => {
    const amt = btn.getAttribute('data-amt')
    const input = document.getElementById('topup-amount') as HTMLInputElement
    if (amt && input) input.value = amt
  })
})

document.getElementById('confirm-topup-btn')?.addEventListener('click', async () => {
  const input = document.getElementById('topup-amount') as HTMLInputElement
  const amount = Number(input.value)
  if (isNaN(amount) || amount <= 0) {
    showToast('Enter a valid amount to add.', 'error')
    return
  }

  walletBalance += amount
  await supabase.from('patients').update({ wallet_balance: walletBalance }).eq('phone', patientPhone)
  kpiWallet.textContent = `₹${walletBalance.toLocaleString('en-IN')}`
  closeModal('topup-modal')
  showToast(`Added ₹${amount.toLocaleString('en-IN')} to your wallet.`, 'success')
})

// Edit Profile Modal
document.getElementById('open-profile-modal-btn')?.addEventListener('click', () => {
  ;(document.getElementById('edit-name') as HTMLInputElement).value = patientName
  ;(document.getElementById('edit-email') as HTMLInputElement).value = patientEmail === 'Not provided' ? '' : patientEmail
  ;(document.getElementById('edit-gender') as HTMLSelectElement).value = patientGender
  openModal('profile-modal')
})

document.getElementById('edit-profile-form')?.addEventListener('submit', async (e) => {
  e.preventDefault()
  const newName = (document.getElementById('edit-name') as HTMLInputElement).value.trim()
  const newEmail = (document.getElementById('edit-email') as HTMLInputElement).value.trim()
  const newGender = (document.getElementById('edit-gender') as HTMLSelectElement).value

  if (!newName) {
    showToast('Name cannot be empty.', 'error')
    return
  }

  const { error } = await supabase
    .from('patients')
    .update({ name: newName, email: newEmail || null, gender: newGender })
    .eq('phone', patientPhone)

  if (error) {
    showToast(`Failed to update profile: ${error.message}`, 'error')
    return
  }

  patientName = newName
  patientEmail = newEmail || 'Not provided'
  patientGender = newGender
  sessionStorage.setItem('patient_name', patientName)
  sessionStorage.setItem('patient_email', newEmail)
  sessionStorage.setItem('patient_gender', patientGender)
  renderProfile()
  closeModal('profile-modal')
  showToast('Profile updated!', 'success')
})

// Cancel Confirmation
document.getElementById('confirm-cancel-btn')?.addEventListener('click', async () => {
  if (!pendingCancelId) return
  const targetId = pendingCancelId
  pendingCancelId = null
  closeModal('cancel-modal')

  const { error } = await supabase
    .from('appointments')
    .update({ status: 'Cancelled' })
    .eq('id', targetId)

  if (error) {
    showToast(`Error cancelling: ${error.message}`, 'error')
  } else {
    showToast('Appointment cancelled.', 'info')
    loadDashboard()
  }
})

// Filter Tabs & Search
document.querySelectorAll('#patient-filter-tabs .cc-filter-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('#patient-filter-tabs .cc-filter-tab').forEach((t) => t.classList.remove('active'))
    tab.classList.add('active')
    currentFilter = tab.getAttribute('data-filter') || 'All'
    renderAppointments()
  })
})

searchInput.addEventListener('input', () => {
  searchQuery = searchInput.value.trim().toLowerCase()
  renderAppointments()
})

function getStatusColor(status: string): string {
  if (status === 'Confirmed') return '#4ade80'
  if (status === 'Awaiting Doctor') return '#eab308'
  if (status === 'Completed') return '#3b82f6'
  if (status === 'Cancelled') return '#888888'
  return '#ef4444'
}

function getRelativeDayLabel(isoTime: string): string {
  const apptDate = new Date(isoTime).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  const todayDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  if (apptDate === todayDate) return 'Today'
  const diffMs = new Date(apptDate).getTime() - new Date(todayDate).getTime()
  const diffDays = Math.round(diffMs / 86400000)
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays > 1) return `In ${diffDays} days`
  if (diffDays === -1) return 'Yesterday'
  return `${Math.abs(diffDays)} days ago`
}

function renderKpisAndSpotlight() {
  const confirmed = appointmentsCache.filter((a) => a.status === 'Confirmed')
  const awaiting = appointmentsCache.filter((a) => a.status === 'Awaiting Doctor')
  const unpaid = appointmentsCache.filter((a) => a.status === 'Unpaid')
  const completed = appointmentsCache.filter((a) => a.status === 'Completed')
  const cancelled = appointmentsCache.filter((a) => a.status === 'Cancelled')
  const upcoming = appointmentsCache.filter((a) => a.status === 'Confirmed' || a.status === 'Awaiting Doctor')

  kpiConfirmed.textContent = String(confirmed.length)
  kpiAwaiting.textContent = String(awaiting.length)
  kpiUnpaid.textContent = String(unpaid.length)
  kpiWallet.textContent = `₹${walletBalance.toLocaleString('en-IN')}`

  cntAll.textContent = String(appointmentsCache.length)
  cntUpcoming.textContent = String(upcoming.length)
  cntUnpaid.textContent = String(unpaid.length)
  cntCompleted.textContent = String(completed.length)
  cntCancelled.textContent = String(cancelled.length)
  apptTotalLabel.textContent = `${appointmentsCache.length} total`

  if (confirmed.length > 0) {
    const nextConf = confirmed[0]
    const formatted = new Date(nextConf.appointment_time).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    })
    kpiConfirmedSub.textContent = `Next: ${formatted}`
  } else {
    kpiConfirmedSub.textContent = 'No upcoming confirmed visits'
  }

  kpiUnpaidSub.textContent = unpaid.length > 0 ? 'Complete payment to confirm slot' : 'All bookings settled'

  // Next Up Spotlight
  const nextAppt =
    confirmed[0] ||
    awaiting[0] ||
    unpaid[0] ||
    null

  if (!nextAppt) {
    spotlightBadge.style.display = 'none'
    spotlightBody.innerHTML = `
      <p style="color: #cbd5e1; font-size: 0.9rem; margin: 0 0 14px 0;">
        You have no active upcoming appointments.
      </p>
      <button type="button" class="btn-neon-teal" style="width: 100%;" onclick="window.location.href='./doctors.html'">
        + Schedule Consultation
      </button>
    `
    return
  }

  const doc = doctorsCache.find((d) => d.id === nextAppt.doctor_id)
  const badgeColor = getStatusColor(nextAppt.status)
  const relLabel = getRelativeDayLabel(nextAppt.appointment_time)
  const formatted = new Date(nextAppt.appointment_time).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  spotlightBadge.style.display = 'inline-flex'
  spotlightBadge.style.background = `${badgeColor}20`
  spotlightBadge.style.color = badgeColor
  spotlightBadge.style.border = `1px solid ${badgeColor}45`
  spotlightBadge.textContent = nextAppt.status

  let ctaHtml = ''
  if (nextAppt.status === 'Unpaid') {
    ctaHtml = `<button type="button" class="btn-neon-yellow" style="width: 100%;" data-pay-id="${escapeHtml(nextAppt.id)}" data-doc-id="${escapeHtml(nextAppt.doctor_id)}">Complete Payment</button>`
  } else if (nextAppt.status === 'Confirmed' && doc?.address) {
    ctaHtml = `<button type="button" class="btn-neon-teal" style="width: 100%;" data-map-doc="${escapeHtml(doc.name)}" data-map-clinic="${escapeHtml(doc.clinic_name)}" data-map-addr="${escapeHtml(doc.address)}">📍 View Clinic Map</button>`
  } else {
    ctaHtml = `<button type="button" class="btn-neon-blue" style="width: 100%;" data-resched-id="${escapeHtml(nextAppt.id)}" data-doc-id="${escapeHtml(nextAppt.doctor_id)}">Reschedule Slot</button>`
  }

  spotlightBody.innerHTML = `
    <div style="margin-bottom: 12px;">
      <span style="display: inline-block; font-size: 0.74rem; color: #2dd4bf; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 4px;">
        ${escapeHtml(relLabel)} · ${escapeHtml(formatted)} IST
      </span>
      <h3 style="margin: 0; font-size: 1.12rem; color: #fff;">${escapeHtml(doc?.name || 'Specialist Doctor')}</h3>
      <p style="margin: 3px 0 0 0; font-size: 0.86rem; color: #e2e8f0;">
        ${escapeHtml(doc?.specialty || 'Consultation')} • ${escapeHtml(doc?.clinic_name || 'CareConnect Clinic')}
      </p>
    </div>
    ${nextAppt.reason ? `<p style="font-size: 0.84rem; color: #cbd5e1; margin: 0 0 14px 0;">Reason: ${escapeHtml(nextAppt.reason)}</p>` : ''}
    ${ctaHtml}
  `

  attachCardHandlers(spotlightBody)
}

function renderAppointments() {
  const filtered = appointmentsCache.filter((appt) => {
    const doc = doctorsCache.find((d) => d.id === appt.doctor_id)
    const matchesTab =
      currentFilter === 'All' ||
      (currentFilter === 'Upcoming' && (appt.status === 'Confirmed' || appt.status === 'Awaiting Doctor')) ||
      appt.status === currentFilter

    if (!matchesTab) return false
    if (!searchQuery) return true

    const haystack = [
      doc?.name || '',
      doc?.specialty || '',
      doc?.clinic_name || '',
      doc?.area || '',
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
        <p style="color: #cbd5e1; margin: 0 0 14px 0;">No appointments match this view.</p>
        <button type="button" class="btn-neon-teal" onclick="window.location.href='./doctors.html'">+ Book an Appointment</button>
      </div>
    `
    return
  }

  filtered.forEach((appt) => {
    const doc = doctorsCache.find((d) => d.id === appt.doctor_id)
    const doctorName = doc ? doc.name : 'Assigned Specialist'
    const specialty = doc ? doc.specialty : 'Consultation'
    const clinicName = doc ? doc.clinic_name : 'CareConnect Clinic'
    const doctorAddress = doc?.address || doc?.area || 'Bengaluru'
    const fee = doc?.consultation_fee ? `₹${doc.consultation_fee}` : '₹500'

    const localTime = new Date(appt.appointment_time).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    })
    const badgeColor = getStatusColor(appt.status)

    let actionButtons = ''
    if (appt.status === 'Unpaid') {
      actionButtons = `
        <button type="button" class="btn-neon-yellow" data-pay-id="${escapeHtml(appt.id)}" data-doc-id="${escapeHtml(appt.doctor_id)}">
          Complete Payment (${fee})
        </button>
        <button type="button" class="btn-neon-red" data-cancel-id="${escapeHtml(appt.id)}">
          Cancel
        </button>
      `
    } else if (appt.status === 'Confirmed') {
      actionButtons = `
        <button type="button" class="btn-neon-teal" data-map-doc="${escapeHtml(doctorName)}" data-map-clinic="${escapeHtml(clinicName)}" data-map-addr="${escapeHtml(doctorAddress)}">
          📍 Clinic Map
        </button>
        <button type="button" class="btn-neon-blue" data-resched-id="${escapeHtml(appt.id)}" data-doc-id="${escapeHtml(appt.doctor_id)}">
          Reschedule
        </button>
        <button type="button" class="btn-neon-red" data-cancel-id="${escapeHtml(appt.id)}">
          Cancel
        </button>
      `
    } else if (appt.status === 'Awaiting Doctor') {
      actionButtons = `
        <button type="button" class="btn-neon-blue" data-resched-id="${escapeHtml(appt.id)}" data-doc-id="${escapeHtml(appt.doctor_id)}">
          Reschedule
        </button>
        <button type="button" class="btn-neon-red" data-cancel-id="${escapeHtml(appt.id)}">
          Cancel Appointment
        </button>
      `
    } else if (appt.status === 'Completed') {
      actionButtons = `
        <button type="button" class="btn-neon-teal" data-rebook-doc="${escapeHtml(appt.doctor_id)}">
          Book Follow-up
        </button>
      `
    }

    const card = document.createElement('div')
    card.className = 'cc-appt-card'
    card.innerHTML = `
      <div class="cc-appt-top">
        <div>
          <h3 class="cc-appt-title">
            <span>${escapeHtml(doctorName)}</span>
            <span style="font-size: 0.72rem; font-weight: 500; padding: 2px 9px; border-radius: 99px; background: rgba(0, 191, 165, 0.14); color: #00BFA5; border: 1px solid rgba(0, 191, 165, 0.3);">
              ${escapeHtml(specialty)}
            </span>
          </h3>
          <p class="cc-appt-sub">${escapeHtml(clinicName)} • ${escapeHtml(doc?.area || 'Bengaluru')}</p>
        </div>
        <span class="status-badge" style="background: ${badgeColor}20; color: ${badgeColor}; border: 1px solid ${badgeColor}45;">
          ${escapeHtml(appt.status)}
        </span>
      </div>

      <div class="cc-appt-meta">
        <span>📅 <strong>${escapeHtml(localTime)} IST</strong></span>
        <span>💳 Fee: <strong>${fee}</strong></span>
        ${appt.reason ? `<span>🩺 Reason: ${escapeHtml(appt.reason)}</span>` : ''}
      </div>

      ${appt.notes ? `<div class="cc-appt-notes"><strong>Doctor Note:</strong> ${escapeHtml(appt.notes)}</div>` : ''}
      ${actionButtons ? `<div class="cc-appt-actions">${actionButtons}</div>` : ''}
    `
    listContainer.appendChild(card)
  })

  attachCardHandlers(listContainer)
}

function attachCardHandlers(scope: HTMLElement) {
  scope.querySelectorAll('[data-pay-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-pay-id')
      const docId = btn.getAttribute('data-doc-id')
      if (id) sessionStorage.setItem('appointment_id', id)
      if (docId) sessionStorage.setItem('doctor_id', docId)
      window.location.href = './payment.html'
    })
  })

  scope.querySelectorAll('[data-resched-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-resched-id')
      const docId = btn.getAttribute('data-doc-id')
      if (docId) sessionStorage.setItem('doctor_id', docId)
      if (id) sessionStorage.setItem('reschedule_id', id)
      window.location.href = './booking.html'
    })
  })

  scope.querySelectorAll('[data-rebook-doc]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const docId = btn.getAttribute('data-rebook-doc')
      sessionStorage.removeItem('reschedule_id')
      if (docId) sessionStorage.setItem('doctor_id', docId)
      window.location.href = './booking.html'
    })
  })

  scope.querySelectorAll('[data-cancel-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      pendingCancelId = btn.getAttribute('data-cancel-id')
      openModal('cancel-modal')
    })
  })

  scope.querySelectorAll('[data-map-addr]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const doc = btn.getAttribute('data-map-doc') || 'Doctor'
      const clinic = btn.getAttribute('data-map-clinic') || 'Clinic'
      const addr = btn.getAttribute('data-map-addr') || 'Bengaluru'
      ;(document.getElementById('map-modal-title') as HTMLElement).textContent = `${clinic} — ${doc}`
      ;(document.getElementById('map-modal-address') as HTMLElement).textContent = `📍 ${addr}`
      ;(document.getElementById('map-modal-iframe') as HTMLIFrameElement).src =
        `https://maps.google.com/maps?q=${encodeURIComponent(addr)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
      openModal('map-modal')
    })
  })
}

async function loadDashboard() {
  const [{ data: appts, error }, { data: docs }, { data: pat }] = await Promise.all([
    supabase
      .from('appointments')
      .select('*')
      .eq('patient_phone', patientPhone)
      .order('appointment_time', { ascending: true }),
    supabase.from('doctors').select('*'),
    supabase.from('patients').select('wallet_balance, name, email, gender').eq('phone', patientPhone).single(),
  ])

  if (error) {
    listContainer.innerHTML = `<p class="error">Database Error: ${escapeHtml(error.message)}</p>`
    return
  }

  if (pat) {
    walletBalance = pat.wallet_balance ?? 5000
    if (pat.name) patientName = pat.name
    if (pat.email) patientEmail = pat.email
    if (pat.gender) patientGender = pat.gender
    renderProfile()
  }

  appointmentsCache = appts || []
  doctorsCache = docs || []

  renderKpisAndSpotlight()
  renderAppointments()
}

loadDashboard()