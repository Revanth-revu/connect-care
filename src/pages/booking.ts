import { supabase } from '../supabase'

// 1. DOM Elements (with safety checks)
const doctorNameEl = document.getElementById('doctor-name')
const doctorDetailsEl = document.getElementById('doctor-details')
const dateSelect = document.getElementById('date-select') as HTMLSelectElement
const slotGrid = document.getElementById('slot-grid')
const reasonInput = document.getElementById('reason') as HTMLInputElement
const confirmBtn = document.getElementById('confirm-btn') as HTMLButtonElement
const errorMsg = document.getElementById('error-msg')

const doctorId = sessionStorage.getItem('doctor_id')
const patientId = sessionStorage.getItem('patient_id')
const patientPhone = sessionStorage.getItem('patient_phone')
const patientEmail = sessionStorage.getItem('patient_email')
const rescheduleId = sessionStorage.getItem('reschedule_id')

let selectedSlot: { date: string; time: string } | null = null

// 2. Initialize Page
if (!doctorId || !patientPhone) {
  // If no session, kick back to login
  window.location.href = './login-patient.html'
} else {
  initPage()
}

async function initPage() {
  // A. Populate Dates IMMEDIATELY (Don't wait for database)
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  
  dateSelect.innerHTML = '' // Clear loading state
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const opt = document.createElement('option')
    opt.value = d.toISOString().split('T')[0]
    opt.textContent = `${dayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]}`
    dateSelect.appendChild(opt)
  }

  // B. Render Time Slots IMMEDIATELY
  renderSlots()

  // C. Fetch Doctor Data safely
  try {
    const { data, error } = await supabase
      .from('doctors')
      .select('name, address, specialty, clinic_name') 
      .eq('id', doctorId)
      .single()
      
    if (error) throw error

    if (data) {
      if (doctorNameEl) {
        doctorNameEl.textContent = rescheduleId ? `Reschedule with ${data.name}` : data.name
      }
      if (doctorDetailsEl) {
        doctorDetailsEl.textContent = `${data.specialty} • ${data.clinic_name}`
      }
      if (confirmBtn) {
        confirmBtn.textContent = rescheduleId ? 'Confirm Reschedule' : 'Confirm Booking'
      }
      
      // Load Map
      if (data.address) {
        const mapContainer = document.getElementById('map-container')
        const mapIframe = document.getElementById('google-map') as HTMLIFrameElement
        if (mapContainer && mapIframe) {
          const encodedAddress = encodeURIComponent(data.address)
          mapIframe.src = `https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`
          mapContainer.style.display = 'block'
        }
      }
    }
  } catch (err: any) {
    console.error("Failed to load doctor:", err)
    if (doctorNameEl) doctorNameEl.textContent = "Doctor Details Unavailable"
  }
}

// 3. Time Slot Logic
const SLOT_HOURS = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00']

function renderSlots() {
  if (!slotGrid) return
  slotGrid.innerHTML = ''
  
  const date = dateSelect.value
  // cSpell:ignore Kolkata
  const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

  SLOT_HOURS.forEach((time, index) => {
    let disabled = false
    
    if (date === todayIST) {
      const [h] = time.split(':').map(Number)
      // cSpell:ignore Kolkata
      const currentISTHour = Number(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false }))
      if (h <= currentISTHour) disabled = true
    }

    const btn = document.createElement('button')
    btn.className = 'slot'
    btn.textContent = `${time} IST`
    btn.disabled = disabled
    btn.style.animationDelay = `${index * 0.05}s`

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

// 4. Date Change Event
dateSelect.addEventListener('change', () => {
  selectedSlot = null
  if (confirmBtn) confirmBtn.disabled = true
  renderSlots()
})

// 5. Confirm Booking Logic
confirmBtn.addEventListener('click', async () => {
  if (errorMsg) errorMsg.textContent = ''
  if (!selectedSlot) return

  confirmBtn.disabled = true
  confirmBtn.textContent = 'Processing...'

  const { date, time } = selectedSlot
  const istTime = `${date}T${time}:00+05:30` 

  if (rescheduleId) {
    // Reschedule Flow
    const { error } = await supabase
      .from('appointments')
      .update({ appointment_time: istTime })
      .eq('id', rescheduleId)

    if (error) {
      if (errorMsg) errorMsg.textContent = error.code === '23505' ? "Slot already booked." : error.message
      confirmBtn.disabled = false
      confirmBtn.textContent = 'Confirm Reschedule'
      return
    }

    sessionStorage.removeItem('reschedule_id')
    sessionStorage.setItem('appointment_id', rescheduleId)
    window.location.href = './confirmation.html'

  } else {
    // New Booking Flow
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        patient_id: patientId,       
        patient_phone: patientPhone,
        patient_email: patientEmail || null, 
        doctor_id: doctorId,
        appointment_time: istTime, 
        reason: reasonInput.value.trim() || null,
        status: 'Unpaid'
      })
      .select()
      .single()

    if (error) {
      if (errorMsg) errorMsg.textContent = error.code === '23505' ? "Slot just booked by someone else." : error.message
      confirmBtn.disabled = false
      confirmBtn.textContent = 'Confirm Booking'
      return
    }

    sessionStorage.setItem('appointment_id', data.id)
    window.location.href = './payment.html' 
  }
})