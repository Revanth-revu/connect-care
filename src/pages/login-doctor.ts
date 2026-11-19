import { supabase } from '../supabase'
import { showToast } from './toast'

const identifierInput = document.getElementById('identifier') as HTMLInputElement
const passwordInput = document.getElementById('password') as HTMLInputElement
const loginBtn = document.getElementById('login-btn') as HTMLButtonElement
const errorMsg = document.getElementById('login-error') as HTMLParagraphElement
const togglePasswordBtn = document.getElementById('toggle-password') as HTMLButtonElement
const eyeIcon = document.getElementById('eye-icon') as unknown as SVGElement
const loginForm = document.getElementById('login-form') as HTMLFormElement
const forgotLink = document.getElementById('forgot-link') as HTMLAnchorElement
const fillDemoBtn = document.getElementById('fill-demo-btn') as HTMLButtonElement

let isPasswordVisible = false

togglePasswordBtn.addEventListener('click', () => {
  isPasswordVisible = !isPasswordVisible
  passwordInput.type = isPasswordVisible ? 'text' : 'password'

  if (isPasswordVisible) {
    eyeIcon.innerHTML = `
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
      <line x1="1" y1="1" x2="23" y2="23"></line>
    `
  } else {
    eyeIcon.innerHTML = `
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    `
  }
})

forgotLink.addEventListener('click', (e) => {
  e.preventDefault()
  showToast('Demo password for doctor1@demo.com is "doc123"', 'info')
})

fillDemoBtn.addEventListener('click', () => {
  identifierInput.value = 'doctor1@demo.com'
  passwordInput.value = 'doc123'
  errorMsg.textContent = ''
  showToast('Demo doctor credentials filled', 'info')
})

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  errorMsg.textContent = ''

  const identifier = identifierInput.value.trim()
  const password = passwordInput.value.trim()

  if (!identifier || !password) {
    errorMsg.textContent = 'Please enter both your credentials.'
    return
  }

  loginBtn.disabled = true
  loginBtn.textContent = 'Authenticating...'

  const { data, error } = await supabase
    .from('doctors')
    .select('*')
    .or(`email.eq.${identifier},phone.eq.${identifier}`)
    .eq('password', password)
    .single()

  if (error || !data) {
    errorMsg.textContent = 'Invalid Doctor ID or Password.'
    loginBtn.disabled = false
    loginBtn.textContent = 'Sign In'
    return
  }

  sessionStorage.setItem('doctor_id', data.id)
  sessionStorage.setItem('doctor_name', data.name || 'Doctor')
  sessionStorage.setItem('doctor_specialty', data.specialty || 'General Consultation')
  sessionStorage.setItem('doctor_clinic', data.clinic_name || 'CareConnect Clinic')
  sessionStorage.setItem('doctor_area', data.area || 'Bengaluru')
  sessionStorage.setItem('doctor_education', data.education || 'MBBS')
  sessionStorage.setItem('doctor_experience', data.experience || '')
  sessionStorage.setItem('doctor_fee', String(data.consultation_fee || 500))

  window.location.href = './doctor-dashboard.html'
})