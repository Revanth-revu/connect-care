import { supabase } from '../supabase'

const debugLog = document.getElementById('debug-log') as HTMLParagraphElement
const feeDisplay = document.getElementById('fee-display') as HTMLElement
const walletBalanceText = document.getElementById('wallet-balance') as HTMLSpanElement
const walletPinInput = document.getElementById('wallet-pin') as HTMLInputElement

const appointmentId = sessionStorage.getItem('appointment_id')
const patientPhone = sessionStorage.getItem('patient_phone')
const doctorId = sessionStorage.getItem('doctor_id')

let currentTab = 'wallet'
let walletBalance = 5000
let actualPin = '1234'
let fee = 500

// 1. Tab Switching Logic
document.querySelectorAll('.pay-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.pay-tab').forEach(t => t.classList.remove('active'))
    tab.classList.add('active')
    document.querySelectorAll('.pay-content').forEach(el => (el as HTMLDivElement).style.display = 'none')
    
    const target = tab.getAttribute('data-target')
    if (target) {
      currentTab = target
      const el = document.getElementById(`content-${target}`)
      if (el) el.style.display = 'block'
    }
  })
})

// 2. Load Data
async function loadData() {
  if (!patientPhone || !doctorId) {
    debugLog.innerText = "Status: Missing session data (using fallback)"
    return
  }

  try {
    const { data: doc } = await supabase.from('doctors').select('consultation_fee').eq('id', doctorId).single()
    if (doc && doc.consultation_fee) {
      fee = doc.consultation_fee
      feeDisplay.textContent = `₹${fee}`
    }

    const { data: pat } = await supabase.from('patients').select('wallet_balance, transaction_pin').eq('phone', patientPhone).single()
    if (pat) {
      walletBalance = pat.wallet_balance || 0
      actualPin = pat.transaction_pin || '1234'
      walletBalanceText.textContent = `₹${walletBalance}`
    }
    debugLog.innerText = "Status: Data Loaded"
  } catch (err) {
    debugLog.innerText = "Status: Error loading data"
  }
}
loadData()

// 3. Add Money
;(window as any).addMoney = async () => {
  const amountStr = prompt("Enter amount to add:")
  if (!amountStr) return
  const amount = Number(amountStr)
  if (isNaN(amount) || amount <= 0) return alert("Invalid amount")

  walletBalance += amount
  if (patientPhone) {
    await supabase.from('patients').update({ wallet_balance: walletBalance }).eq('phone', patientPhone)
  }
  walletBalanceText.textContent = `₹${walletBalance}`
  alert("Money added!")
}

// 4. The Main Payment Function (Called directly from HTML)
;(window as any).processPayment = async () => {
  debugLog.innerText = "Status: Button clicked!"
  
  // Validate
  if (currentTab === 'wallet') {
    if (walletBalance < fee) {
      debugLog.innerText = "Status: Insufficient balance"
      alert(`Insufficient Balance! You have ₹${walletBalance} but need ₹${fee}.`)
      return
    }
    if (walletPinInput.value !== actualPin) {
      debugLog.innerText = "Status: Wrong PIN"
      alert("Incorrect PIN! Enter 1234.")
      return
    }
  }

  debugLog.innerText = "Status: Processing..."
  const btn = document.getElementById('pay-btn') as HTMLButtonElement
  if (btn) btn.disabled = true

  setTimeout(async () => {
    try {
      // Deduct wallet
      if (currentTab === 'wallet' && patientPhone) {
        const newBal = walletBalance - fee
        await supabase.from('patients').update({ wallet_balance: newBal }).eq('phone', patientPhone)
      }

      // Update appointment
      if (appointmentId) {
        const { error } = await supabase.from('appointments').update({ status: 'Awaiting Doctor' }).eq('id', appointmentId)
        if (error) throw new Error("DB Error: " + error.message)
      }

      debugLog.innerText = "Status: Success!"
      alert("Payment Successful!")
      window.location.href = './confirmation.html'

    } catch (err: any) {
      debugLog.innerText = "Status: Failed"
      alert("Error: " + err.message)
      if (btn) btn.disabled = false
    }
  }, 1000)
}