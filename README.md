

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

**1. Navigate to the HR Frontend directory**
```bash
cd Front-end-HR
2. Install Dependencies
Important Note: Because Vite and some standard React linting tools have strict version requirements, you must use the --legacy-peer-deps flag to install the Electron packages successfully without version conflicts.

Bash
npm install --legacy-peer-deps
💻 Running in Development Mode
To work on the app and see changes update in real-time, start the development server. This will launch the Vite local server and automatically open the Electron desktop window.

Bash
npm run electron:dev
Note: Ensure your Node.js backend is actively running, otherwise the login screen will show a "Backend is running" network error.

📦 Building for Production (Creating the .exe / .dmg)
When you are ready to distribute the app to the HR team, you need to package it into an installer.

⚠️ IMPORTANT WARNING FOR WINDOWS USERS:
Electron-builder needs to create "Symbolic Links" during the packaging process. Windows restricts this for normal users. You MUST run your terminal as an Administrator before running the build command, otherwise the build will fail at the very end.

1. Open your terminal (Git Bash, Command Prompt, or VS Code) as an Administrator.
2. Navigate to the project folder.
3. Run the build command:

Bash
npm run electron:build
4. Locate the Installer:
Once the build is complete, navigate to the Front-end-HR/release/ folder.
You will find your packaged setup file (e.g., 6R Diamond HR Setup.exe). You can send this file directly to the HR staff to install on their computers.

📁 Project Structure Notes
main.js - The entry point for the Electron desktop window.

vite.config.js - Configured with base: './' to ensure the React build can be read directly from the local hard drive by Electron.

src/config/api.js - Contains logic to switch between standard web URLs and http://localhost:5000 when the app detects it is running in a desktop environment (file: protocol).


### How to use this:
1. Open your `Front-end-HR` folder in VS Code.
2. Find the existing `README.md` file (or create one if it doesn't exist).
3. Paste this code inside and save it!
