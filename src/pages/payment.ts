import { supabase } from '../supabase'
import { showToast } from './toast'

const feeDisplay = document.getElementById('fee-display') as HTMLElement
const walletBalanceText = document.getElementById('wallet-balance') as HTMLSpanElement
const walletPinInput = document.getElementById('wallet-pin') as HTMLInputElement
const upiInput = document.getElementById('upi-input') as HTMLInputElement
const cardNumberInput = document.getElementById('card-number') as HTMLInputElement
const cardExpiryInput = document.getElementById('card-expiry') as HTMLInputElement
const cardCvvInput = document.getElementById('card-cvv') as HTMLInputElement
const payBtn = document.getElementById('pay-btn') as HTMLButtonElement
const payStatus = document.getElementById('pay-status') as HTMLParagraphElement
const qrImg = document.getElementById('qr-img') as HTMLImageElement

const topupModal = document.getElementById('topup-modal') as HTMLDivElement
const openTopupBtn = document.getElementById('open-topup-btn') as HTMLButtonElement
const closeTopupBtn = document.getElementById('close-topup-btn') as HTMLButtonElement
const topupAmountInput = document.getElementById('topup-amount') as HTMLInputElement
const confirmTopupBtn = document.getElementById('confirm-topup-btn') as HTMLButtonElement

const appointmentId = sessionStorage.getItem('appointment_id')
const patientPhone = sessionStorage.getItem('patient_phone')
const doctorId = sessionStorage.getItem('doctor_id')

if (!patientPhone) {
  window.location.href = './login-patient.html'
}

let currentTab = 'wallet'
let walletBalance = 5000
let actualPin = '1234'
let fee = 500

document.querySelectorAll('.pay-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.pay-tab').forEach((t) => t.classList.remove('active'))
    tab.classList.add('active')
    document.querySelectorAll('.pay-content').forEach((el) => ((el as HTMLDivElement).style.display = 'none'))

    const target = tab.getAttribute('data-target')
    if (target) {
      currentTab = target
      const el = document.getElementById(`content-${target}`)
      if (el) el.style.display = 'block'
    }
  })
})

async function loadData() {
  try {
    let resolvedDoctorId = doctorId

    if (!resolvedDoctorId && appointmentId) {
      const { data: appt } = await supabase
        .from('appointments')
        .select('doctor_id')
        .eq('id', appointmentId)
        .single()
      if (appt?.doctor_id) resolvedDoctorId = appt.doctor_id
    }

    if (resolvedDoctorId) {
      const { data: doc } = await supabase
        .from('doctors')
        .select('consultation_fee')
        .eq('id', resolvedDoctorId)
        .single()
      if (doc && doc.consultation_fee) {
        fee = doc.consultation_fee
      }
    }

    feeDisplay.textContent = `₹${fee}`
    payBtn.textContent = `Pay ₹${fee}`
    if (qrImg) {
      qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`upi://pay?pa=careconnect@okaxis&pn=CareConnect%20Clinic&am=${fee}&cu=INR`)}`
    }

    if (patientPhone) {
      const { data: pat } = await supabase
        .from('patients')
        .select('wallet_balance, transaction_pin')
        .eq('phone', patientPhone)
        .single()
      if (pat) {
        walletBalance = pat.wallet_balance ?? 0
        actualPin = pat.transaction_pin || '1234'
      }
    }
    walletBalanceText.textContent = `₹${walletBalance.toLocaleString('en-IN')}`
  } catch {
    walletBalanceText.textContent = `₹${walletBalance.toLocaleString('en-IN')}`
  }
}

loadData()

// Modal Top-up
openTopupBtn.addEventListener('click', () => {
  topupModal.style.display = 'flex'
})
closeTopupBtn.addEventListener('click', () => {
  topupModal.style.display = 'none'
})
document.querySelectorAll('.quick-amt').forEach((btn) => {
  btn.addEventListener('click', () => {
    const amt = btn.getAttribute('data-amt')
    if (amt) topupAmountInput.value = amt
  })
})

confirmTopupBtn.addEventListener('click', async () => {
  const amount = Number(topupAmountInput.value)
  if (isNaN(amount) || amount <= 0) {
    showToast('Please enter a valid positive amount.', 'error')
    return
  }

  walletBalance += amount
  if (patientPhone) {
    await supabase.from('patients').update({ wallet_balance: walletBalance }).eq('phone', patientPhone)
  }
  walletBalanceText.textContent = `₹${walletBalance.toLocaleString('en-IN')}`
  topupModal.style.display = 'none'
  showToast(`Added ₹${amount.toLocaleString('en-IN')} to your CareConnect Wallet!`, 'success')
})

payBtn.addEventListener('click', async () => {
  payStatus.textContent = ''

  if (currentTab === 'wallet') {
    if (walletBalance < fee) {
      showToast(`Insufficient Balance (₹${walletBalance}). Need ₹${fee}.`, 'error')
      return
    }
    if (walletPinInput.value.trim() !== actualPin) {
      showToast('Incorrect Wallet PIN. Demo PIN is 1234.', 'error')
      return
    }
  } else if (currentTab === 'upi') {
    const upi = upiInput.value.trim()
    if (!/^[\w.-]+@[\w.-]+$/.test(upi)) {
      showToast('Enter a valid UPI ID (e.g., name@okicici).', 'error')
      return
    }
  } else if (currentTab === 'card') {
    const digits = cardNumberInput.value.replace(/\s+/g, '')
    const exp = cardExpiryInput.value.trim()
    const cvv = cardCvvInput.value.trim()
    if (!/^\d{12,19}$/.test(digits) || !/^\d{2}\/\d{2}$/.test(exp) || !/^\d{3}$/.test(cvv)) {
      showToast('Please enter valid Card Number, MM/YY Expiry, and 3-digit CVV.', 'error')
      return
    }
  }

  payBtn.disabled = true
  payBtn.textContent = 'Processing Payment...'
  payStatus.textContent = 'Verifying payment securely...'

  setTimeout(async () => {
    try {
      if (currentTab === 'wallet' && patientPhone) {
        const newBal = walletBalance - fee
        await supabase.from('patients').update({ wallet_balance: newBal }).eq('phone', patientPhone)
      }

      if (appointmentId) {
        const { error } = await supabase
          .from('appointments')
          .update({ status: 'Awaiting Doctor' })
          .eq('id', appointmentId)
        if (error) throw new Error(error.message)
      }

      showToast('Payment successful! Appointment sent to doctor.', 'success')
      setTimeout(() => {
        window.location.href = './confirmation.html'
      }, 600)
    } catch (err: any) {
      payStatus.textContent = 'Payment failed.'
      showToast(err.message || 'Payment error', 'error')
      payBtn.disabled = false
      payBtn.textContent = `Pay ₹${fee}`
    }
  }, 800)
})