

# 6R Diamond HR - Desktop Application 💎

This is the official Desktop Application for the **6R Diamond International Cargo Logistics, Inc.** Human Resources team. Built with React (Vite) and packaged with Electron, this application serves as the Recruitment Management System dashboard.

## 🛠️ Tech Stack
* **Frontend:** React.js, Vite
* **Desktop Wrapper:** Electron, Electron-Builder
* **Backend Connection:** Node.js / Express (Expects backend on `localhost:5000` or production URL)
* **Database:** Supabase

---

## 📋 Prerequisites
Before you begin, ensure you have the following installed on your machine:
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* Git

You will also need the **Back-end** server running locally (or hosted online) for the app to authenticate users and fetch data.

---

## 🚀 Installation & Setup

### Step 1: Download the 6RDIAMOND App
1. Clone this repository or download it as a ZIP file to your machine.
2. Open the downloaded project folder in VS Code.
3. Confirm that the `Back-end` folder is available alongside `Front-end-HR`.

### Step 2: Open the HR Frontend folder
```bash
cd Front-end-HR
```

### Step 3: Install dependencies
```bash
npm install --legacy-peer-deps
```
> Use `--legacy-peer-deps` because Electron and related packages may require older peer dependency resolution.

### Step 4: Start the backend server
In a separate terminal, run the backend first so the desktop app can connect:
```bash
cd ../Back-end
npm install
npm start
```
> The HR app expects the backend to be running on `http://localhost:5000`.

### Step 5: Run the HR frontend desktop app
Back in the `Front-end-HR` folder, start the app:
```bash
npm run electron:dev
```
This command starts the Vite development server and opens the Electron desktop window.

### Step 6: Build the production installer (optional)
When you are ready to package the app for distribution:
1. Open your terminal as Administrator on Windows.
2. In `Front-end-HR`, run:
```bash
npm run electron:build
```
3. After the build finishes, find the installer in:
```bash
Front-end-HR/release/
```

📁 Project Structure Notes
main.js - The entry point for the Electron desktop window.

vite.config.js - Configured with `base: './'` so the React build can be loaded from the local file system by Electron.

src/config/api.js - Contains logic to switch between standard web URLs and `http://localhost:5000` when the app detects a desktop environment.
