# TaskFlow — Team Task Manager

A full-stack web application for managing team projects, assigning tasks, and tracking progress with role-based access control.

**Live Demo:** [your-railway-url-here]  
**Tech Stack:** Node.js · Express · PostgreSQL · Vanilla JS · HTML/CSS

---

## 📁 Project Structure

```
taskflow/
├── backend/
│   ├── db/index.js          ← Database connection + table setup
│   ├── middleware/auth.js   ← JWT authentication + role checks
│   ├── routes/
│   │   ├── auth.js          ← /api/auth (login, register)
│   │   ├── users.js         ← /api/users (list, search, role update)
│   │   ├── projects.js      ← /api/projects (CRUD + members)
│   │   ├── tasks.js         ← /api/tasks (CRUD + comments)
│   │   └── dashboard.js     ← /api/dashboard (stats)
│   ├── server.js            ← Main entry point
│   ├── package.json
│   └── .env.example
└── frontend/
    └── index.html           ← Entire frontend (single file)
```

---

## 🚀 Deployment Guide (Railway) — Step by Step

This guide assumes you have never used a terminal before. Follow every step carefully.

---

### STEP 1: Install Node.js

1. Go to **https://nodejs.org**
2. Download the **LTS version** (the green button)
3. Install it — just click Next, Next, Finish
4. To verify: open **Command Prompt** (Windows) or **Terminal** (Mac) and type:
   ```
   node --version
   ```
   You should see something like `v20.x.x`

---

### STEP 2: Install Git

1. Go to **https://git-scm.com/downloads**
2. Download and install for your OS
3. Verify by typing in terminal:
   ```
   git --version
   ```

---

### STEP 3: Create a GitHub Account + Repository

1. Go to **https://github.com** and sign up (free)
2. Click **New Repository** (green button)
3. Name it `taskflow`
4. Set it to **Public**
5. Click **Create repository**

---

### STEP 4: Upload Your Code to GitHub

Open your terminal in the `taskflow` folder and run these commands **one by one**:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/taskflow.git
git push -u origin main
```

> Replace `YOUR_USERNAME` with your actual GitHub username.

---

### STEP 5: Create a Railway Account

1. Go to **https://railway.app**
2. Click **Login with GitHub** — this connects your code automatically

---

### STEP 6: Deploy the Backend

1. On Railway dashboard, click **New Project**
2. Select **Deploy from GitHub repo**
3. Choose your `taskflow` repository
4. Railway will detect it — click **Add service**
5. When it asks for the **root directory**, type: `backend`
6. Click **Deploy**

---

### STEP 7: Add a PostgreSQL Database

1. In your Railway project, click **+ New**
2. Select **Database → PostgreSQL**
3. Railway creates a database automatically
4. Click on the database → go to **Variables** tab
5. Copy the value of `DATABASE_URL`

---

### STEP 8: Set Environment Variables for Backend

1. Click on your **backend service** in Railway
2. Go to **Variables** tab
3. Add these variables one by one:

| Variable | Value |
|---|---|
| `DATABASE_URL` | (paste the one you copied above) |
| `JWT_SECRET` | `taskflow_secret_key_2024_xyz` (make this random) |
| `NODE_ENV` | `production` |
| `PORT` | `5000` |

4. Click **Deploy** again (or it redeploys automatically)

---

### STEP 9: Get Your Backend URL

1. Click on your backend service
2. Go to **Settings → Networking**
3. Click **Generate Domain**
4. You'll get a URL like: `https://taskflow-backend.up.railway.app`
5. **Copy this URL** — you need it next

---

### STEP 10: Connect Frontend to Backend

1. Open `frontend/index.html` in any text editor (Notepad works)
2. Find this line near the top of the `<script>` section:
   ```javascript
   const API = window.API_URL || 'http://localhost:5000/api';
   ```
3. Change it to:
   ```javascript
   const API = 'https://YOUR-BACKEND-URL.up.railway.app/api';
   ```
4. Save the file

---

### STEP 11: Deploy the Frontend

Option A — **Deploy on Railway** (recommended):
1. In Railway, click **+ New → Static Site**
2. Choose your `taskflow` repo
3. Set root directory to: `frontend`
4. Set start command to: (leave empty — it's just HTML)
5. Done! You'll get another URL for the frontend.

Option B — **Use Netlify** (even easier for static files):
1. Go to **https://netlify.com** → sign up free
2. Drag and drop your `frontend` folder onto the Netlify dashboard
3. Done — you get a URL instantly

---

### STEP 12: Test Your Live App

1. Open your frontend URL
2. Click **Create Account** → register as **Admin**
3. Create a project, add tasks, register a Member account, assign tasks
4. Everything should work!

---

## 🔧 Running Locally (for testing before deployment)

```bash
# 1. Go to backend folder
cd taskflow/backend

# 2. Install dependencies
npm install

# 3. Create .env file (copy from example)
cp .env.example .env
# Then edit .env and fill in your local PostgreSQL details

# 4. Start the server
npm run dev

# 5. Open frontend/index.html in your browser
# It connects to localhost:5000 by default
```

---

## 🌐 API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login, get JWT token |
| GET | `/api/auth/me` | Get current user |

### Projects
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create project (Admin) |
| GET | `/api/projects/:id` | Get project + members |
| PATCH | `/api/projects/:id` | Update project (Admin) |
| DELETE | `/api/projects/:id` | Delete project (Admin) |
| POST | `/api/projects/:id/members` | Add member (Admin) |

### Tasks
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tasks` | List tasks (filtered) |
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks/:id` | Get task + comments |
| PATCH | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| POST | `/api/tasks/:id/comments` | Add comment |

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard` | Get stats + recent/overdue |

---

## 🎤 INTERVIEW CHEAT SHEET

Read this once a day for 3 days. You'll know it cold.

---

### Q: "Walk me through your project."

**Say this:**
> "I built TaskFlow, a full-stack team task manager. It has two roles — Admin and Member. Admins can create projects, add team members, and manage everything. Members can see their assigned tasks and update their status. On the backend I used Node.js with Express to build REST APIs, and PostgreSQL as the database. The frontend is pure HTML, CSS, and JavaScript — no frameworks. I deployed it on Railway."

---

### Q: "Why did you choose this tech stack?"

**Say this:**
> "I chose Node.js and Express because they're lightweight and fast to build APIs with. PostgreSQL because the data has clear relationships — users belong to projects, tasks belong to projects and have assignees — so a relational database made sense. For the frontend I went with vanilla JavaScript because it keeps things simple and there's no build step needed."

---

### Q: "How does login/authentication work?"

**Say this:**
> "When a user logs in, the backend checks their email and password. The password is never stored as plain text — it's hashed using bcrypt before saving. If the credentials match, the server generates a JWT — a JSON Web Token — which is basically a signed string that proves who you are. The frontend stores this token in localStorage and sends it with every request in the Authorization header. The backend verifies it on every protected route."

---

### Q: "What is role-based access control and how did you implement it?"

**Say this:**
> "Role-based access control means different users have different permissions. In my app, Admins can create projects, delete tasks, and manage team members. Members can only view their projects and update their own tasks. I implemented this with middleware — a function that runs before the route handler. It checks the user's role from the database and either allows the request or returns a 403 Forbidden error."

---

### Q: "What is a REST API?"

**Say this:**
> "REST is a way of structuring APIs using standard HTTP methods. GET to fetch data, POST to create, PATCH to update, DELETE to remove. Each URL represents a resource — like `/api/projects` for projects. I followed REST conventions throughout — for example, `/api/projects/5/members` to manage members of project 5."

---

### Q: "What was the hardest part?"

**Say this:**
> "The trickiest part was the access control logic. For example, when fetching tasks, admins should see all tasks, but members should only see tasks in their projects or assigned to them. Writing the SQL queries to handle both cases cleanly took some thinking — I used conditional WHERE clauses based on the user's role."

---

### Q: "What is a JWT token?"

**Say this:**
> "JWT stands for JSON Web Token. It has three parts separated by dots — a header, a payload, and a signature. The payload contains user data like the user ID and role. The signature is generated using a secret key on the server, so no one can fake a token without knowing the key. It's stateless — the server doesn't need to store sessions, it just verifies the signature on each request."

---

### Q: "What is bcrypt?"

**Say this:**
> "Bcrypt is a password hashing algorithm. Instead of storing passwords in plain text, bcrypt converts them into a fixed-length hash. The same password always produces a different hash because of a random salt. To verify a login, you hash the entered password and compare it to the stored hash. Even if someone steals the database, they can't reverse the hashes to get the original passwords."

---

### Q: "How do projects and tasks relate to each other in your database?"

**Say this:**
> "I have four main tables — users, projects, tasks, and project_members. Tasks have a foreign key pointing to projects, meaning each task belongs to one project. project_members is a join table that connects users and projects, since one user can be in many projects and one project can have many users. This is called a many-to-many relationship. Tasks also have a foreign key to users for the assignee."

---

### Q: "What would you improve if you had more time?"

**Say this:**
> "A few things — real-time updates using WebSockets so you can see task changes live without refreshing. Email notifications for task assignments. A Kanban board view with drag-and-drop. And proper test coverage — I'd add unit tests for the API routes using Jest."

---

*Good luck — you've got this.* 🚀
