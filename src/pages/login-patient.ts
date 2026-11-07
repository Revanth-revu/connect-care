import { supabase } from '../supabase'

const identifierInput = document.getElementById('identifier') as HTMLInputElement
const passwordInput = document.getElementById('password') as HTMLInputElement
const loginBtn = document.getElementById('login-btn') as HTMLButtonElement
const errorMsg = document.getElementById('login-error') as HTMLParagraphElement
const togglePasswordBtn = document.getElementById('toggle-password') as HTMLButtonElement
const loginForm = document.getElementById('login-form') as HTMLFormElement
const eyeIcon = document.getElementById('eye-icon') as unknown as SVGElement

// --- Password Visibility Toggle ---
let isPasswordVisible = false

togglePasswordBtn.addEventListener('click', () => {
  isPasswordVisible = !isPasswordVisible
  passwordInput.type = isPasswordVisible ? 'text' : 'password'
  
  // Swap the SVG icon
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

// --- Login Form Submission ---
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
    .from('patients')
    .select('*')
    .or(`email.eq.${identifier},phone.eq.${identifier}`)
    .eq('password', password)
    .single()

  if (error || !data) {
    errorMsg.textContent = 'Invalid Patient ID or Password.'
    loginBtn.disabled = false
    loginBtn.textContent = 'Sign In'
    return
  }

  sessionStorage.setItem('patient_id', data.id)
  sessionStorage.setItem('patient_phone', data.phone)
  sessionStorage.setItem('patient_name', data.name)
  sessionStorage.setItem('patient_email', data.email || '')
  sessionStorage.setItem('patient_gender', data.gender || 'Not specified')
  
  window.location.href = './patient-dashboard.html'
})