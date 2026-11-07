# One Click Schedule (CareConnect)

A Bengaluru-first clinic appointment concept, designed around Indian patient journeys and health-tech interoperability. 

## 🚀 Features
- **Patient Portal:** Book, reschedule, or cancel appointments. View clinic locations via Google Maps. Pay via simulated Wallet, UPI, QR, or Card.
- **Doctor Portal:** Manage schedules, accept/reject appointments, and join mock teleconsultations.
- **Premium UI/UX:** 3D particle backgrounds, Glassmorphism cards, and Neon glowing buttons.
- **Secure Database:** Built with Supabase (PostgreSQL) with Row Level Security.

## 🛠️ Tech Stack
- **Frontend:** HTML, CSS, TypeScript, Vite
- **Backend/Database:** Supabase
- **3D Graphics:** Three.js
- **Deployment:** Vercel

## 💻 Local Setup
1. Clone the repository:
   `git clone https://github.com/Revanth-revu/connect-care.git`
2. Install dependencies:
   `npm install`
3. Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key# care-connect
