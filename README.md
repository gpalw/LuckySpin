# 🎯 LuckySpin

A web-based **Prize Wheel System** built with **Node.js** and **React**, designed for real-world event use.  
Operators can log in via tablet (e.g. iPad) to activate a prize wheel, spin multiple times, and track inventory automatically.  
Perfect for event management, marketing campaigns, or as a personal demo project.

---

## 🚀 Features

- **Secure Login System** – Admin-defined accounts (no public registration)
- **Multi-User Isolation** – Each user sees only their own wheels and prizes
- **Weighted Random Draws** – Server-side controlled probabilities
- **Atomic Stock Updates** – Inventory automatically decreases with each win
- **Manual Restock** – Refill prizes anytime without breaking sessions
- **Multi-language Support** – Prize name and win messages in English & Chinese
- **Operator Dashboard (iPad Friendly)** – Activate, pause, and spin easily
- **Audit Log & Fairness** – Signed draw records for verifiable fairness
- **Session Locking** – Prevent multiple devices from spinning the same wheel
- **Idempotent APIs** – Duplicate requests won’t double-deduct stock
- **Fully Responsive UI** – Optimized for desktop, tablet, and kiosk use

---

## 🧩 Tech Stack

| Layer | Stack |
|-------|--------|
| **Frontend** | React + Tailwind CSS + Vite |
| **Backend** | Node.js + Express + Prisma ORM |
| **Database** | PostgreSQL / MySQL |
| **Auth** | JWT (Access + Refresh tokens) |
| **Deployment** | Docker + Nginx + PM2 |
| **Other** | TypeScript, bcrypt, crypto, Redis (optional) |

---

## 📂 Project Structure

```
luckyspin/
├── backend/
│   ├── src/
│   │   ├── prisma/              # Schema & migrations
│   │   ├── routes/              # API routes
│   │   ├── services/            # Core business logic
│   │   ├── middlewares/
│   │   └── utils/
│   ├── .env.example
│   ├── package.json
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── api/
│   │   └── styles/
│   ├── package.json
│   └── README.md
├── docker-compose.yml
└── README.md
```

---

## ⚙️ Installation & Run

### 1️⃣ Backend Setup
```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run dev
```

### 2️⃣ Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Visit the app at:  
**http://localhost:5173**

---

## 🧠 How It Works

1. **Admin** creates a wheel and defines prize weights, messages, and stock.
2. **Operator** logs in via iPad → Activates the wheel → Spins N times.
3. Each draw:
   - Calculates result server-side (cryptographically fair).
   - Deducts prize stock atomically.
   - Writes draw record + digital signature.
4. **Admin** can restock or view real-time statistics anytime.

---

## 🧱 API Overview (Simplified)

| Endpoint | Method | Description |
|-----------|--------|--------------|
| `/api/auth/login` | POST | Login and get tokens |
| `/api/roulettes` | GET/POST | Create or list wheels |
| `/api/roulettes/:id/draw` | POST | Perform one draw |
| `/api/prizes/:id/stock` | PATCH | Increase or set stock |
| `/api/records` | GET | View draw records |
| `/api/audit` | GET | View audit log |

---

## 📱 Operator Dashboard (Kiosk Mode)

- **Large Buttons**: Spin Once / Spin N Times / Pause / Resume / Restock
- **Session Lock**: Only one active device per wheel
- **Heartbeat**: Keeps the session alive (auto-pause if disconnected)
- **Offline Safe**: Cached last draw, resync on reconnect

---

## 🔒 Security Highlights

- All passwords hashed with **bcrypt**
- All random draws handled **server-side**
- Draw records digitally signed with **HMAC(secret)**
- JWT tokens stored in HttpOnly cookies
- IP + device fingerprint + session tracked per draw
- Strict CORS and HTTPS enforcement

---

## 📊 Example Use Cases

- 🎡 Event prize draws (expos, fairs, campus events)
- 🏪 Retail marketing & customer engagement
- 🎁 Internal company lucky draws
- 💻 Demo project for full-stack interviews

---

## 📜 License

MIT License © 2025 Wen Liang

---

## 🙌 Credits

Developed by **Wen Liang**  
Based in Auckland, New Zealand  
GitHub: [gpalw](https://github.com/gpalw)
