import { supabase } from '../supabase'

const listContainer = document.getElementById('doctor-appointments') as HTMLDivElement
const doctorId = sessionStorage.getItem('doctor_id')

if (!doctorId) {
  window.location.href = './login-doctor.html'
}

async function loadDoctorSchedule() {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('doctor_id', doctorId)
    .order('appointment_time', { ascending: true })

  if (error) {
    listContainer.innerHTML = `<p class="error">Error: ${error.message}</p>`
    return
  }

  if (data.length === 0) {
    listContainer.innerHTML = `<div class="glass-panel"><p style="color:#aaa; text-align:center;">No appointments scheduled yet.</p></div>`
    return
  }

  // Fetch patients to match their phone number to their gender
  const { data: patientsData } = await supabase.from('patients').select('phone, gender')

  listContainer.innerHTML = ''
  
  data.forEach((appt) => {
    const localTime = new Date(appt.appointment_time).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short'
    })

    const patientRecord = patientsData?.find(p => p.phone === appt.patient_phone)
    const patientGender = patientRecord ? patientRecord.gender : 'Unknown'

    // Badge Colors
    let badgeColor = '#ef4444' // Unpaid (Red)
    if (appt.status === 'Awaiting Doctor') badgeColor = '#eab308' // Yellow
    if (appt.status === 'Confirmed') badgeColor = '#4ade80' // Green
    if (appt.status === 'Completed') badgeColor = '#3b82f6' // Blue
    if (appt.status === 'Cancelled') badgeColor = '#888' // Gray

    let actionButtons = ''
    
    // Doctor can only accept if payment is done (Awaiting Doctor)
    if (appt.status === 'Awaiting Doctor') {
      actionButtons = `
        <button onclick="updateStatus('${appt.id}', 'Confirmed')" class="btn-neon-teal" style="width: 100%;">
          Accept Appointment
        </button>
      `
    } else if (appt.status === 'Confirmed') {
      actionButtons = `
        <div style="display: flex; gap: 10px; margin-top: 12px;">
          <button onclick="updateStatus('${appt.id}', 'Completed')" class="btn-neon-blue" style="flex: 1;">
            Mark Completed
          </button>
          <button onclick="window.open('https://meet.google.com/new', '_blank')" class="btn-neon-teal" style="flex: 1;">
            🎥 Join Video Call
          </button>
        </div>
      `
    }

    const card = document.createElement('div')
    card.className = 'appointment-card'
    
    card.innerHTML = `
      <div class="appointment-header">
        <div>
          <h3>Patient: +91 ${appt.patient_phone}</h3>
          <p>Gender: ${patientGender}</p>
          <p>Email: ${appt.patient_email || 'Not provided'}</p>
          <p>Reason: ${appt.reason || 'Not specified'}</p>
          <p style="color:#fff; font-weight:500; margin-top:8px;">📅 ${localTime} IST</p>
        </div>
        <span class="status-badge" style="background: ${badgeColor}20; color: ${badgeColor}; border: 1px solid ${badgeColor}40;">
          ${appt.status}
        </span>
      </div>
      <div style="margin-top: 16px;">
         ${actionButtons}
      </div>
    `
    listContainer.appendChild(card)
  })
}

// Global function to update status
(window as any).updateStatus = async (id: string, newStatus: string) => {
  const { data, error } = await supabase
    .from('appointments')
    .update({ status: newStatus })
    .eq('id', id)
    .select()

  if (error) {
    alert("Error updating status: " + error.message)
  } else if (data && data.length === 0) {
    alert("Failed to update. Database permissions might be missing.")
  } else {
    loadDoctorSchedule() // Refresh the list
  }
}

loadDoctorSchedule()