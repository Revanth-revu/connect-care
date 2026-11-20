import { supabase } from '../supabase'
import { escapeHtml } from './toast'

const detailsEl = document.getElementById('details') as HTMLDivElement
const appointmentId = sessionStorage.getItem('appointment_id')

async function loadDetails() {
  if (!appointmentId) {
    detailsEl.innerHTML = '<p style="color: #ef4444; text-align: center;">No appointment ID found. Please return to your dashboard.</p>'
    return
  }

  const { data, error } = await supabase
    .from('appointments')
    .select('*, doctors(name, clinic_name, area, specialty, consultation_fee)')
    .eq('id', appointmentId)
    .single()

  if (error || !data) {
    detailsEl.innerHTML = `<p style="color: #ef4444; text-align: center;">Could not load details: ${escapeHtml(error?.message || 'Not found')}</p>`
    return
  }

  const doctor = (data.doctors as any) || {
    name: 'Assigned Specialist',
    clinic_name: 'CareConnect Clinic',
    area: 'Bengaluru',
    consultation_fee: 500,
  }

  const localTime = new Date(data.appointment_time).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  let badgeColor = '#eab308'
  if (data.status === 'Confirmed') badgeColor = '#4ade80'
  if (data.status === 'Cancelled') badgeColor = '#888888'
  if (data.status === 'Unpaid') badgeColor = '#ef4444'

  detailsEl.innerHTML = `
    <div class="detail-row stagger-row" style="animation-delay: 0.25s;">
      <span style="color: #cbd5e1; font-weight: 500;">Doctor</span>
      <span style="color: #ffffff; font-weight: 600;">${escapeHtml(doctor.name)}</span>
    </div>
    <div class="detail-row stagger-row" style="animation-delay: 0.35s;">
      <span style="color: #cbd5e1; font-weight: 500;">Clinic</span>
      <span style="color: #ffffff; font-weight: 500;">${escapeHtml(doctor.clinic_name)}, ${escapeHtml(doctor.area)}</span>
    </div>
    <div class="detail-row stagger-row" style="animation-delay: 0.45s;">
      <span style="color: #cbd5e1; font-weight: 500;">When</span>
      <span style="color: #ffffff; font-weight: 500;">${escapeHtml(localTime)} IST</span>
    </div>
    <div class="detail-row stagger-row" style="animation-delay: 0.55s;">
      <span style="color: #cbd5e1; font-weight: 500;">Status</span>
      <span class="status-badge" style="background: ${badgeColor}28; color: ${badgeColor}; border: 1px solid ${badgeColor}65;">
        ${escapeHtml(data.status)}
      </span>
    </div>
  `
}

loadDetails()