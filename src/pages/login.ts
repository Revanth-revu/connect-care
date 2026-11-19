const phoneStep = document.getElementById('step-phone') as HTMLDivElement
const otpStep = document.getElementById('step-otp') as HTMLDivElement
const phoneInput = document.getElementById('phone') as HTMLInputElement
const otpInput = document.getElementById('otp') as HTMLInputElement
const sendBtn = document.getElementById('send-otp-btn') as HTMLButtonElement
const verifyBtn = document.getElementById('verify-btn') as HTMLButtonElement
const phoneDisplay = document.getElementById('phone-display') as HTMLSpanElement
const phoneError = document.getElementById('phone-error') as HTMLParagraphElement
const otpError = document.getElementById('otp-error') as HTMLParagraphElement
const roleSelect = document.getElementById('role-select') as HTMLSelectElement

let currentPhone = ''

sendBtn.addEventListener('click', () => {
  const phone = phoneInput.value.trim()
  phoneError.textContent = ''

  if (!/^[6-9]\d{9}$/.test(phone)) {
    phoneError.textContent = 'Enter a valid 10-digit Indian mobile number.'
    return
  }

  currentPhone = phone
  phoneDisplay.textContent = phone
  phoneStep.style.display = 'none'
  otpStep.style.display = 'block'
  otpInput.focus()
})

verifyBtn.addEventListener('click', () => {
  otpError.textContent = ''
  const otp = otpInput.value.trim()

  if (otp !== '123456') {
    otpError.textContent = 'Invalid OTP. Use 123456 for the demo.'
    return
  }

  const role = roleSelect.value

  if (role === 'doctor') {
    sessionStorage.setItem('doctor_id', 'e23dc9de-0c45-4a57-a084-b1404eed7588')
    sessionStorage.setItem('doctor_name', 'Dr. Vikram Sharma')
    window.location.href = './doctor-dashboard.html'
  } else {
    sessionStorage.setItem('patient_id', 'pat-1001-aarya')
    sessionStorage.setItem('patient_phone', currentPhone)
    sessionStorage.setItem('patient_name', 'CareConnect Patient')
    window.location.href = './patient-dashboard.html'
  }
})