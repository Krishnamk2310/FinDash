<h1 align="center">💸 FinDash – Smart Expense, Budget & Analytics Tracker 📊</h1>
⭐ Highlights

🔐 JWT Authentication for secure login & protected routes

📊 Analytics Dashboard with charts for category breakdown & spending trends

💰 Budget Management with category-wise limits & progress tracking

🧾 Expense Manager to Add, Search, Filter, Sort & Export expenses

🖥️ Beautiful, Modern & Responsive UI

🗃️ Supabase / MongoDB Compatible backend structure

⚡ Built with React + TypeScript + Tailwind + Vite

🖼️ Screenshots
🔐 Authentication Page
<img src="/mnt/data/71e30201-6f23-41a5-986f-31aab5b7c820.png" />
📊 Dashboard
<img src="/mnt/data/e921ae91-519e-45e9-b3a8-ca9413c47c20.png" />
📈 Analytics
<img src="/mnt/data/29f5d669-5463-4d10-9a96-3d8cb7185d8c.png" />
💰 Budget Management
<img src="/mnt/data/114a0292-84af-414a-b99e-05287e532108.png" />
🧪 .env Setup
Frontend (/)
VITE_API_BASE_URL=<your_backend_url>
VITE_JWT_SECRET=<your_jwt_secret>
VITE_SUPABASE_URL=<your_supabase_url>
VITE_SUPABASE_ANON_KEY=<your_supabase_anon_key>

Backend (if using custom Node/Express)
PORT=5000
MONGO_URI=<your_mongo_uri>
JWT_SECRET=<your_jwt_secret>

🔧 Run the Frontend
npm install
npm run dev

🖥️ Tech Stack
Frontend

React + TypeScript

Tailwind CSS

React Router

Axios

Recharts / Chart.js

Vite

Backend

Node.js

Express.js

JWT Authentication

Bcrypt

Supabase / MongoDB

📁 Project Structure
src/
  components/
  pages/
  contexts/
  hooks/
  integrations/
  lib/
  main.tsx
public/
