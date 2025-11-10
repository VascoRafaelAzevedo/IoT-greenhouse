# 🌿 Greenhouse Project

This repository contains both the **frontend** (React) and **backend** (Node.js + Express) parts of the Greenhouse project.

---

## ⚛️ Frontend (React + Vite + Tailwind)

The **frontend** is built using **React**, **Vite**, **TypeScript**, and **Tailwind CSS**, with UI components powered by **Radix UI** and **shadcn/ui**.  
It communicates with the backend API for data.

### 🚀 Tech Stack

- **React 19 + Vite 7** – Fast, modern frontend tooling  
- **TypeScript** – Type safety for cleaner, more reliable code  
- **Tailwind CSS** – Utility-first styling  
- **Radix UI / shadcn/ui** – Accessible, composable UI components  
- **Axios** – HTTP client for API calls  
- **React Hook Form** – Forms and validation  
- **Recharts** – Data visualization  
- **Lucide Icons** – Clean and lightweight icon set  

### ⚙️ Setup

#### 1. Navigate to frontend folder

```bash
cd frontend
```

#### 2. Install dependencies

```bash
npm install
```

#### 3. Create environment file

Create `.env` in `frontend`:

```bash
VITE_API_URL=http://localhost:4000
```

#### 4. Run development server

```bash
npm run dev
```

Then open:  
👉 http://localhost:5173

#### 5. Build for production

```bash
npm run build
npm run preview
```

#### 6. Linting

```bash
npm run lint
```

---

## 🌱 Backend (Node.js + Express + PostgreSQL)

The **backend** is a REST API built using **Express**, with **PostgreSQL** as the database.  
It handles data storage, API routing, and business logic for the Greenhouse project.

### 🛠️ Tech Stack

- **Node.js + Express** – Web server and routing  
- **PostgreSQL** – Database  
- **pg** – PostgreSQL client  
- **dotenv** – Environment variable management  
- **CORS** – Cross-origin resource sharing  

### ⚙️ Setup

#### 1. Navigate to backend folder

```bash
cd backend
```

#### 2. Install dependencies

```bash
npm install
```

#### 3. Create environment file

Create a `.env` file in the `backend` directory:

```bash
PORT=4000
USE_MOCK_DB=true
DATABASE_URL=postgres://user:password@localhost:5432/greenhouse
```

#### 4. Run development server

```bash
npm run dev
```

Backend runs at:  
👉 http://localhost:4000

#### 5. Start production server

```bash
npm start
```

---

## 🔗 Connecting Frontend & Backend

The frontend communicates with the backend via the `VITE_API_URL` environment variable.  
Make sure the backend server is running **before** starting the frontend.

Example setup:

```
Backend → http://localhost:4000
Frontend → http://localhost:5173
```

---

## 🧩 Useful Commands

| Command | Description |
|----------|--------------|
| `npm run dev` | Start development mode |
| `npm run build` | Build frontend for production |
| `npm run preview` | Preview frontend production build |
| `npm run lint` | Lint frontend code |
| `npm start` | Start backend server (production) |

---

## 🪴 Author & License

Created by the **Greenhouse Dev Team**  
License: **MIT**
