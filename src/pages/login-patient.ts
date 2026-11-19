import { supabase } from '../supabase'
import { showToast } from './toast'

const identifierInput = document.getElementById('identifier') as HTMLInputElement
const passwordInput = document.getElementById('password') as HTMLInputElement
const loginBtn = document.getElementById('login-btn') as HTMLButtonElement
const errorMsg = document.getElementById('login-error') as HTMLParagraphElement
const togglePasswordBtn = document.getElementById('toggle-password') as HTMLButtonElement
const loginForm = document.getElementById('login-form') as HTMLFormElement
const registerForm = document.getElementById('register-form') as HTMLFormElement
const registerBtn = document.getElementById('register-btn') as HTMLButtonElement
const eyeIcon = document.getElementById('eye-icon') as unknown as SVGElement
const forgotLink = document.getElementById('forgot-link') as HTMLAnchorElement
const toggleAuthLink = document.getElementById('toggle-auth-link') as HTMLAnchorElement
const toggleAuthText = document.getElementById('toggle-auth-text') as HTMLParagraphElement
const authTitle = document.getElementById('auth-title') as HTMLHeadingElement
const authSubtitle = document.getElementById('auth-subtitle') as HTMLParagraphElement
const fillDemoBtn = document.getElementById('fill-demo-btn') as HTMLButtonElement

let isPasswordVisible = false
let isRegisterMode = false

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
  showToast('Demo password for patient1@demo.com is "pat123"', 'info')
})

fillDemoBtn.addEventListener('click', () => {
  if (isRegisterMode) switchMode(false)
  identifierInput.value = 'patient1@demo.com'
  passwordInput.value = 'pat123'
  errorMsg.textContent = ''
  showToast('Demo patient credentials filled', 'info')
})

function switchMode(register: boolean) {
  isRegisterMode = register
  errorMsg.textContent = ''
  if (register) {
    loginForm.style.display = 'none'
    registerForm.style.display = 'block'
    authTitle.textContent = 'Create Account'
    authSubtitle.textContent = 'Join CareConnect for instant clinic bookings.'
    toggleAuthText.innerHTML = `Already have an account? <a href="#" id="toggle-auth-link-inner" class="footer-link">Sign in</a>`
    document.getElementById('toggle-auth-link-inner')?.addEventListener('click', (ev) => {
      ev.preventDefault()
      switchMode(false)
    })
  } else {
    registerForm.style.display = 'none'
    loginForm.style.display = 'block'
    authTitle.textContent = 'Welcome Back'
    authSubtitle.textContent = 'Sign in to manage your appointments.'
    toggleAuthText.innerHTML = `Don't have an account? <a href="#" id="toggle-auth-link-inner" class="footer-link">Create one</a>`
    document.getElementById('toggle-auth-link-inner')?.addEventListener('click', (ev) => {
      ev.preventDefault()
      switchMode(true)
    })
  }
}

toggleAuthLink.addEventListener('click', (e) => {
  e.preventDefault()
  switchMode(!isRegisterMode)
})

function persistPatientSession(data: any) {
  sessionStorage.setItem('patient_id', data.id)
  sessionStorage.setItem('patient_phone', data.phone)
  sessionStorage.setItem('patient_name', data.name)
  sessionStorage.setItem('patient_email', data.email || '')
  sessionStorage.setItem('patient_gender', data.gender || 'Not specified')
}

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

  persistPatientSession(data)
  window.location.href = './patient-dashboard.html'
})

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  errorMsg.textContent = ''

  const name = (document.getElementById('reg-name') as HTMLInputElement).value.trim()
  const phone = (document.getElementById('reg-phone') as HTMLInputElement).value.trim()
  const email = (document.getElementById('reg-email') as HTMLInputElement).value.trim()
  const gender = (document.getElementById('reg-gender') as HTMLSelectElement).value
  const password = (document.getElementById('reg-password') as HTMLInputElement).value.trim()

  if (!name || !/^\d{10}$/.test(phone) || !email.includes('@') || password.length < 4) {
    errorMsg.textContent = 'Please provide a valid name, 10-digit phone, email, and 4+ char password.'
    return
  }

  registerBtn.disabled = true
  registerBtn.textContent = 'Creating Account...'

  const { data, error } = await supabase
    .from('patients')
    .insert({
      name,
      phone,
      email,
      gender,
      password,
      wallet_balance: 2000,
      transaction_pin: '1234',
    })
    .select()
    .single()

  if (error || !data) {
    errorMsg.textContent = error?.message || 'Unable to create account.'
    registerBtn.disabled = false
    registerBtn.textContent = 'Create Patient Account'
    return
  }

  persistPatientSession(data)
  window.location.href = './patient-dashboard.html'
})