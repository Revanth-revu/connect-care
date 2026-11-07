import { defineConfig } from 'vite'

export default defineConfig({
  // Base public path when served in development or production
  base: '/',
  build: {
    outDir: 'dist',

    rollupOptions: {
      input: [
        'index.html',
        'src/pages/booking.html',
        'src/pages/confirmation.html',
        'src/pages/doctor-dashboard.html',
        'src/pages/doctors.html',
        'src/pages/login-doctor.html',
        'src/pages/login-patient.html',
        'src/pages/login.html',
        'src/pages/patient-dashboard.html',
        'src/pages/payment.html',
      ],
    },
  }
})