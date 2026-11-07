import { supabase } from '../supabase'

// --- DOM Elements for Login ---
const identifierInput = document.getElementById('identifier') as HTMLInputElement
const passwordInput = document.getElementById('password') as HTMLInputElement
const loginBtn = document.getElementById('login-btn') as HTMLButtonElement
const errorMsg = document.getElementById('login-error') as HTMLParagraphElement
const togglePasswordBtn = document.getElementById('toggle-password') as HTMLButtonElement
const loginForm = document.getElementById('login-form') as HTMLFormElement

// --- 1. Floating Label Logic ---
const inputs = document.querySelectorAll<HTMLInputElement>('.input-group input')
inputs.forEach(input => {
  const parent = input.parentElement as HTMLDivElement
  if (input.value !== '') parent.classList.add('active')
  input.addEventListener('focus', () => parent.classList.add('active'))
  input.addEventListener('blur', () => {
    if (input.value === '') parent.classList.remove('active')
  })
})

// --- 2. Password Visibility Toggle ---
togglePasswordBtn.addEventListener('click', () => {
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text'
    togglePasswordBtn.textContent = '🙈'
  } else {
    passwordInput.type = 'password'
    togglePasswordBtn.textContent = '👁️'
  }
})

// --- 3. Login Form Submission ---
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

  // Query the DOCTORS table instead of patients
  const { data, error } = await supabase
    .from('doctors')
    .select('*')
    .or(`email.eq.${identifier},phone.eq.${identifier}`)
    .eq('password', password)
    .single()

  if (error || !data) {
    errorMsg.textContent = 'Invalid Doctor ID or Password.'
    loginBtn.disabled = false
    loginBtn.textContent = 'Login as Doctor'
    return
  }

  // Save doctor info to session storage
  sessionStorage.setItem('doctor_id', data.id)
  sessionStorage.setItem('doctor_name', data.name)
  
  // Redirect to doctor dashboard
  window.location.href = './doctor-dashboard.html'
})  