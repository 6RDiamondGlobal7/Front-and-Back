

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

<<<<<<< HEAD
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
=======
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
>>>>>>> f51a5962b12e14b5edf15115639c44c2d6ce81e7

📁 Project Structure Notes
main.js - The entry point for the Electron desktop window.

<<<<<<< HEAD
vite.config.js - Configured with `base: './'` so the React build can be loaded from the local file system by Electron.

src/config/api.js - Contains logic to switch between standard web URLs and `http://localhost:5000` when the app detects a desktop environment.
=======
vite.config.js - Configured with base: './' to ensure the React build can be read directly from the local hard drive by Electron.

src/config/api.js - Contains logic to switch between standard web URLs and http://localhost:5000 when the app detects it is running in a desktop environment (file: protocol).


### How to use this:
1. Open your `Front-end-HR` folder in VS Code.
2. Find the existing `README.md` file (or create one if it doesn't exist).
3. Paste this code inside and save it!
>>>>>>> f51a5962b12e14b5edf15115639c44c2d6ce81e7
