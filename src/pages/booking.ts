import { supabase } from '../supabase'

const doctorNameEl = document.getElementById('doctor-name')
const doctorDetailsEl = document.getElementById('doctor-details')
const feeBadgeEl = document.getElementById('fee-badge') as HTMLSpanElement
const clinicAddressEl = document.getElementById('clinic-address-text') as HTMLParagraphElement
const dateSelect = document.getElementById('date-select') as HTMLSelectElement
const slotGrid = document.getElementById('slot-grid')
const reasonInput = document.getElementById('reason') as HTMLInputElement
const confirmBtn = document.getElementById('confirm-btn') as HTMLButtonElement
const backBtn = document.getElementById('back-btn') as HTMLButtonElement
const errorMsg = document.getElementById('error-msg')

const doctorId = sessionStorage.getItem('doctor_id')
const patientId = sessionStorage.getItem('patient_id')
const patientPhone = sessionStorage.getItem('patient_phone')
const patientEmail = sessionStorage.getItem('patient_email')
const rescheduleId = sessionStorage.getItem('reschedule_id')

let selectedSlot: { date: string; time: string } | null = null
let bookedSlotKeys = new Set<string>()

const SLOT_HOURS = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00']

function getISTDateParts(offsetDays = 0) {
  const now = new Date()
  const istNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  istNow.setDate(istNow.getDate() + offsetDays)
  const yyyy = istNow.getFullYear()
  const mm = String(istNow.getMonth() + 1).padStart(2, '0')
  const dd = String(istNow.getDate()).padStart(2, '0')
  return {
    isoDate: `${yyyy}-${mm}-${dd}`,
    dateObj: istNow,
  }
}

function getISTSlotKey(isoTimestamp: string): string {
  const dt = new Date(isoTimestamp)
  const datePart = dt.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  const timePart = dt.toLocaleTimeString('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  return `${datePart}|${timePart}`
}

backBtn.addEventListener('click', () => {
  if (rescheduleId) {
    sessionStorage.removeItem('reschedule_id')
    window.location.href = './patient-dashboard.html'
  } else {
    window.location.href = './doctors.html'
  }
})

if (!doctorId || !patientPhone) {
  window.location.href = './login-patient.html'
} else {
  initPage()
}

async function initPage() {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  dateSelect.innerHTML = ''
  for (let i = 0; i < 7; i++) {
    const { isoDate, dateObj } = getISTDateParts(i)
    const opt = document.createElement('option')
    opt.value = isoDate
    opt.textContent = `${i === 0 ? 'Today · ' : i === 1 ? 'Tomorrow · ' : ''}${dayNames[dateObj.getDay()]}, ${dateObj.getDate()} ${monthNames[dateObj.getMonth()]}`
    dateSelect.appendChild(opt)
  }

  renderSlots()

  try {
    const [{ data: docData, error: docErr }, { data: existingAppts }] = await Promise.all([
      supabase
        .from('doctors')
        .select('name, address, specialty, clinic_name, consultation_fee')
        .eq('id', doctorId)
        .single(),
      supabase
        .from('appointments')
        .select('id, appointment_time, status')
        .eq('doctor_id', doctorId),
    ])

    if (docErr) throw docErr

    if (existingAppts) {
      bookedSlotKeys = new Set(
        existingAppts
          .filter((a: any) => a.status !== 'Cancelled' && a.id !== rescheduleId)
          .map((a: any) => getISTSlotKey(a.appointment_time))
      )
      renderSlots()
    }

    if (docData) {
      if (doctorNameEl) {
        doctorNameEl.textContent = rescheduleId ? `Reschedule with ${docData.name}` : docData.name
      }
      if (doctorDetailsEl) {
        doctorDetailsEl.textContent = `${docData.specialty} • ${docData.clinic_name}`
      }
      if (docData.consultation_fee && feeBadgeEl) {
        feeBadgeEl.textContent = `Fee: ₹${docData.consultation_fee}`
        feeBadgeEl.style.display = 'inline-flex'
      }
      if (confirmBtn) {
        confirmBtn.textContent = rescheduleId ? 'Confirm Reschedule' : 'Confirm Booking'
      }

      if (docData.address) {
        const mapContainer = document.getElementById('map-container')
        const mapIframe = document.getElementById('google-map') as HTMLIFrameElement
        if (clinicAddressEl) clinicAddressEl.textContent = `📍 ${docData.address}`
        if (mapContainer && mapIframe) {
          const encodedAddress = encodeURIComponent(docData.address)
          mapIframe.src = `https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`
          mapContainer.style.display = 'block'
        }
      }
    }
  } catch (err: any) {
    console.error('Failed to load doctor:', err)
    if (doctorNameEl) doctorNameEl.textContent = 'Doctor Details Unavailable'
  }
}

function renderSlots() {
  if (!slotGrid) return
  slotGrid.innerHTML = ''

  const date = dateSelect.value
  const todayIST = getISTDateParts(0).isoDate

  SLOT_HOURS.forEach((time, index) => {
    let disabled = false
    let isTaken = bookedSlotKeys.has(`${date}|${time}`)

    if (date === todayIST) {
      const [h] = time.split(':').map(Number)
      const currentISTHour = Number(
        new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false })
      )
      if (h <= currentISTHour) disabled = true
    }

    if (isTaken) disabled = true

    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'slot'
    btn.textContent = isTaken ? `${time} (Booked)` : `${time} IST`
    btn.disabled = disabled
    btn.style.animationDelay = `${index * 0.04}s`

    if (selectedSlot && selectedSlot.date === date && selectedSlot.time === time) {
      btn.classList.add('selected')
    }

    btn.onclick = () => {
      selectedSlot = { date, time }
      renderSlots()
      if (confirmBtn) confirmBtn.disabled = false
    }
    slotGrid.appendChild(btn)
  })
}

dateSelect.addEventListener('change', () => {
  selectedSlot = null
  if (confirmBtn) confirmBtn.disabled = true
  renderSlots()
})

confirmBtn.addEventListener('click', async () => {
  if (errorMsg) errorMsg.textContent = ''
  if (!selectedSlot) return

  confirmBtn.disabled = true
  confirmBtn.textContent = 'Processing...'

  const { date, time } = selectedSlot
  const istTime = `${date}T${time}:00+05:30`

  if (rescheduleId) {
    const { error } = await supabase
      .from('appointments')
      .update({ appointment_time: istTime })
      .eq('id', rescheduleId)

    if (error) {
      if (errorMsg) errorMsg.textContent = error.code === '23505' ? 'Slot already booked.' : error.message
      confirmBtn.disabled = false
      confirmBtn.textContent = 'Confirm Reschedule'
      return
    }

    sessionStorage.removeItem('reschedule_id')
    sessionStorage.setItem('appointment_id', rescheduleId)
    window.location.href = './confirmation.html'
  } else {
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        patient_id: patientId,
        patient_phone: patientPhone,
        patient_email: patientEmail || null,
        doctor_id: doctorId,
        appointment_time: istTime,
        reason: reasonInput.value.trim() || null,
        status: 'Unpaid',
      })
      .select()
      .single()

    if (error) {
      if (errorMsg) errorMsg.textContent = error.code === '23505' ? 'Slot just booked by someone else.' : error.message
      confirmBtn.disabled = false
      confirmBtn.textContent = 'Confirm Booking'
      return
    }

    sessionStorage.setItem('appointment_id', data.id)
    window.location.href = './payment.html'
  }
})