# Relay — Team Task Manager



<!-- ═══════════════════════════════════════════════════════ -->

## Deployment Guide


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
3. Name it `relay`
4. Set it to **Public**
5. Click **Create repository**

---

### STEP 4: Upload Your Code to GitHub

Open your terminal in the `relay` folder and run these commands **one by one**:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/relay.git
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
3. Choose your `relay` repository
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
| `JWT_SECRET` | `relay_secret_key_2024_xyz` (make this random) |
| `NODE_ENV` | `production` |
| `PORT` | `5000` |

4. Click **Deploy** again (or it redeploys automatically)

---

### STEP 9: Get Your Backend URL

1. Click on your backend service
2. Go to **Settings → Networking**
3. Click **Generate Domain**
4. You'll get a URL like: `https://relay-backend.up.railway.app`
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
2. Choose your `relay` repo
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


