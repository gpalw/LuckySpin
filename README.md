# 🎯 LuckySpin

> 🧩 Currently in active development — real-world tested in live events.

A web-based **Prize Wheel System** built with **Node.js** and **React**, designed for real-world marketing and event use.  
Operators can log in via tablet (e.g. iPad) to activate a prize wheel, spin multiple times, and track inventory automatically.  
The system has been successfully used in **offline promotional events** to manage on-site lucky draws and monitor prize inventory in real time.

---

🌐 **Live Demo**  
🔗 https://luckyspin.liangwendev.com

- Supports **Google Sign-In**
- Authorized users can also log in using **username + password**

---

## 🚀 Features

- **Secure Login System** – Admin-defined accounts (no public registration)
- **Google OAuth Login** – Simplified access for verified users
- **Multi-User Isolation** – Each user manages their own wheels and prizes
- **Weighted Random Draws** – Server-side controlled probabilities
- **Atomic Stock Updates** – Inventory safely decreases per win
- **Manual Restock** – Adjust prize stock anytime
- **Multi-language Support** – English & Chinese prize names and messages
- **iPad-Friendly Dashboard** – Activate, pause, and spin with ease
- **Audit Log & Fairness** – Digitally signed draw records
- **Session Locking** – Prevent multiple devices using one wheel
- **Idempotent APIs** – Duplicate requests won’t double-deduct stock
- **Responsive UI** – Optimized for desktop, tablet, and kiosk screens

---

## 🧩 Tech Stack

| Layer | Stack |
|-------|--------|
| **Frontend** | React + Tailwind CSS + Vite |
| **Backend** | Node.js + Express + Prisma ORM |
| **Database** | PostgreSQL / MySQL |
| **Auth** | JWT (Access + Refresh tokens), Google OAuth |
| **Deployment** | Nginx + PM2 |
| **Other** | TypeScript, bcrypt, crypto |

---

## 📂 Project Structure

```
luckyspin/
├── backend/
│   ├── src/
│   │   ├── prisma/          # Schema & migrations
│   │   ├── routes/          # API routes
│   │   ├── services/        # Core business logic
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
└── README.md
```

---

## ⚙️ Installation & Run

### 1️⃣ Backend
```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run dev
```

> ⚠️ If you plan to enable third-party login (e.g., Google OAuth),  
> please complete the relevant fields in your `.env` file.

### 2️⃣ Frontend
```bash
cd frontend
npm install
npm run dev
```

Visit the app at:  
👉 **http://localhost:5173**

---

# 启动后端服务 (这会解决 502 Bad Gateway)
pm2 delete luckyspin-api 
pm2 start /var/www/luckyspin/backend/dist/server.js --name "luckyspin-api"
pm2 save

# 重启 Nginx (确保一切都是最新的)
sudo systemctl restart nginx

## 🧠 How It Works

1. **Admin** creates a wheel and defines prize weights, messages, and stock.  
2. **Operator** logs in via tablet → Activates the wheel → Spins N times.  
3. Each draw:
   - Calculates the result server-side (cryptographically fair)
   - Deducts prize stock atomically
   - Records the result with a digital signature  
4. **Admin** can restock prizes or view statistics anytime.

---

## 🧱 API Overview (Simplified)

| Endpoint | Method | Description |
|-----------|--------|-------------|
| `/api/auth/login` | POST | Login and get tokens |
| `/api/auth/google` | GET / Callback | Google OAuth login |
| `/api/roulettes` | GET / POST | Create or list wheels |
| `/api/roulettes/:id/draw` | POST | Perform one draw |
| `/api/prizes/:id/stock` | PATCH | Restock or adjust prize |
| `/api/records` | GET | View draw history |
| `/api/audit` | GET | View audit log |

---

## 📱 Operator Dashboard (Kiosk Mode)

- **Large Buttons:** Spin Once / Spin N Times / Pause / Resume / Restock  
- **Session Lock:** One active device per wheel  
- **Heartbeat:** Keeps the session alive  
- **Offline Safe:** Cached last draw, resync on reconnect  

---

## 🔒 Security Highlights

- Passwords hashed with **bcrypt**
- All draws handled **server-side**
- Records digitally signed with **HMAC(secret)**
- JWT stored in HttpOnly cookies
- Session & device fingerprints tracked
- Strict CORS and HTTPS enforcement

---

## 📊 Example Use Cases

- 🎡 Offline event prize draws (fairs, expos, campus)
- 🏪 Retail store promotions & marketing campaigns
- 🎁 Internal company lucky draws
- 💻 Full-stack demo project for developer portfolios

---

## 🧩 TODO

- [ ] Multi-language UI toggle (EN / 中文)  
- [ ] Default demo wheel for new users  
- [ ] UI polish – auto refresh after tab switch, weight explanation, wheel colors  
- [ ] Functional upgrades – infinite stock option, optional win animations, more OAuth providers  
- [ ] Send welcome email on first successful login  

---

## 📜 License

MIT License © 2025 Wen Liang

---

## 🙌 Credits

Developed by **Wen Liang**  
Based in Auckland, New Zealand  
GitHub: [gpalw](https://github.com/gpalw)  
Live demo: https://luckyspin.liangwendev.com
