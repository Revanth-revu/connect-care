import { supabase } from '../supabase'

const displayName = document.getElementById('display-name') as HTMLHeadingElement
const displayPhone = document.getElementById('display-phone') as HTMLSpanElement
const displayEmail = document.getElementById('display-email') as HTMLSpanElement
const displayGender = document.getElementById('display-gender') as HTMLSpanElement
const listContainer = document.getElementById('appointments-list') as HTMLDivElement

const patientPhone = sessionStorage.getItem('patient_phone')
const patientName = sessionStorage.getItem('patient_name')
const patientEmail = sessionStorage.getItem('patient_email')
const patientGender = sessionStorage.getItem('patient_gender')

if (!patientPhone) {
  window.location.href = './login-patient.html'
} else {
  displayName.textContent = patientName || 'My Profile'
  displayPhone.textContent = patientPhone
  displayEmail.textContent = patientEmail || 'Not provided'
  displayGender.textContent = patientGender || 'Not specified'
}

async function loadAppointments() {
  const { data, error } = await supabase
    .from('appointments')
    .select('*') 
    .eq('patient_phone', patientPhone)
    .order('appointment_time', { ascending: true })

  if (error) {
    listContainer.innerHTML = `<p class="error">Database Error: ${error.message}</p>`
    return
  }

  if (data.length === 0) {
    listContainer.innerHTML = `<div class="glass-panel"><p style="color:#aaa; text-align:center;">You have no appointments booked yet.</p></div>`
    return
  }

  const { data: doctorsData } = await supabase.from('doctors').select('*')
  
  listContainer.innerHTML = ''
  
  data.forEach((appt) => {
    const doctor = doctorsData?.find(d => d.id === appt.doctor_id)
    const doctorName = doctor ? doctor.name : 'Unknown Doctor'
    const clinicName = doctor ? doctor.clinic_name : 'Unknown Clinic'
    const doctorAddress = doctor ? doctor.address : ''

    const localTime = new Date(appt.appointment_time).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short'
    })

    let badgeColor = '#ef4444' // Unpaid (Red)
    if (appt.status === 'Awaiting Doctor') badgeColor = '#eab308' // Yellow
    if (appt.status === 'Confirmed') badgeColor = '#4ade80' // Green
    if (appt.status === 'Cancelled') badgeColor = '#888' // Gray

    const card = document.createElement('div')
    card.className = 'appointment-card'
    
    let actionButtons = ''
    
    if (appt.status === 'Unpaid') {
      actionButtons = `
        <button class="btn-neon-yellow" style="width: 100%; margin-top: 12px;" onclick="sessionStorage.setItem('appointment_id', '${appt.id}'); window.location.href='./payment.html'">
          Complete Payment
        </button>
      `
    } else if (appt.status === 'Confirmed') {
      const encodedAddress = encodeURIComponent(doctorAddress)
      actionButtons = `
        <div style="display: flex; gap: 10px; margin-top: 12px;">
          <button class="btn-neon-teal" style="flex: 1;" onclick="window.open('https://www.google.com/maps/search/?api=1&query=${encodedAddress}', '_blank')">
            📍 View Clinic Location
          </button>
          <button class="btn-neon-blue" onclick="rescheduleAppointment('${appt.doctor_id}', '${appt.id}')">
            Reschedule
          </button>
        </div>
      `
    } else if (appt.status === 'Awaiting Doctor') {
      actionButtons = `
        <button class="btn-neon-red" style="width: 100%; margin-top: 12px;" onclick="cancelAppointment('${appt.id}')">
          Cancel Appointment
        </button>
      `
    }

    card.innerHTML = `
      <div class="appointment-header">
        <div>
          <h3>${doctorName}</h3>
          <p>${clinicName}</p>
          <p style="color:#fff; font-weight:500; margin-top:8px;">📅 ${localTime} IST</p>
        </div>
        <span class="status-badge" style="background: ${badgeColor}20; color: ${badgeColor}; border: 1px solid ${badgeColor}40;">
          ${appt.status}
        </span>
      </div>
      ${actionButtons}
    `
    listContainer.appendChild(card)
  })
}

(window as any).rescheduleAppointment = (docId: string, apptId: string) => {
  sessionStorage.setItem('doctor_id', docId)
  sessionStorage.setItem('reschedule_id', apptId)
  window.location.href = './booking.html'
}

(window as any).cancelAppointment = async (id: string) => {
  const confirmCancel = confirm("Are you sure you want to cancel this appointment?")
  if (!confirmCancel) return

  const { error } = await supabase
    .from('appointments')
    .update({ status: 'Cancelled' })
    .eq('id', id)

  if (error) {
    alert("Error cancelling: " + error.message)
  } else {
    loadAppointments()
  }
}

loadAppointments()