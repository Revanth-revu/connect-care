import { supabase } from '../supabase'

const detailsEl = document.getElementById('details') as HTMLDivElement
const appointmentId = sessionStorage.getItem('appointment_id')

async function loadDetails() {
  if (!appointmentId) {
    detailsEl.innerHTML = '<p style="color: #ef4444; text-align: center;">No appointment ID found. Please go back.</p>'
    return
  }

  const { data, error } = await supabase
    .from('appointments')
    .select('*, doctors(name, clinic_name, area)')
    .eq('id', appointmentId)
    .single()

  if (error || !data) {
    detailsEl.innerHTML = `<p style="color: #ef4444; text-align: center;">Could not load details: ${error?.message}</p>`
    return
  }

  const doctor = data.doctors as any
  const localTime = new Date(data.appointment_time).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short'
  })

  // Notice the explicit color: #ffffff for the values
  detailsEl.innerHTML = `
    <div class="detail-row stagger-row" style="animation-delay: 0.5s;">
      <span style="color: #888;">Doctor:</span>
      <span style="color: #ffffff; font-weight: 600;">${doctor.name}</span>
    </div>
    <div class="detail-row stagger-row" style="animation-delay: 0.6s;">
      <span style="color: #888;">Clinic:</span>
      <span style="color: #ffffff; font-weight: 500;">${doctor.clinic_name}, ${doctor.area}</span>
    </div>
    <div class="detail-row stagger-row" style="animation-delay: 0.7s;">
      <span style="color: #888;">When:</span>
      <span style="color: #ffffff; font-weight: 500;">${localTime} IST</span>
    </div>
    <div class="detail-row stagger-row" style="animation-delay: 0.8s;">
      <span style="color: #888;">Status:</span>
      <span class="status-badge" style="background: rgba(234, 179, 8, 0.15); color: #eab308; border: 1px solid #eab30840; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">
        ${data.status}
      </span>
    </div>
  `
}

loadDetails()