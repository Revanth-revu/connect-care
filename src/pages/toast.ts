export function showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
  let container = document.getElementById('toast-container')
  if (!container) {
    container = document.createElement('div')
    container.id = 'toast-container'
    document.body.appendChild(container)
  }

  const toast = document.createElement('div')
  toast.className = `toast ${type}`

  const icon = type === 'success' ? '✓' : type === 'error' ? '!' : 'i'
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${escapeHtml(message)}</span>`

  container.appendChild(toast)

  setTimeout(() => {
    toast.classList.add('toast-hide')
    setTimeout(() => toast.remove(), 300)
  }, 3400)
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}