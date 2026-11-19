import { defineConfig } from 'vite'

export default defineConfig({
  // Base public path when served in development or production
  base: '/',
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
  build: {
    outDir: 'dist',

    rolldownOptions: {
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
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'vendor-three',
              test: /node_modules[\\/]three/,
              maxSize: 300000,
            },
            {
              name: 'vendor-supabase',
              test: /node_modules[\\/]@supabase/,
            },
          ],
        },
      },
    },
  },
})