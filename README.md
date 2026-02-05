# Medinest - Pharmacy Management System 🏥📦

Medinest is a comprehensive, secure, and modern pharmacy management platform designed to streamline operations and enhance user experience.

## 📁 Project Structure

```text
.
├── web_frontend/    # React + Vite frontend application
├── web_backend/     # Node.js + Express backend server
├── ssl/             # SSL certificates for secure local development
└── BURP_SETUP_GUIDE.md # Security testing documentation
```

## 🚀 Main Features

- **Full-featured E-commerce**: Browsing medications, cart management, and secure checkout.
- **Advanced Security**: 2FA, JWT, Rate Limiting, and Input Sanitization.
- **Admin Dashboard**: Comprehensive management of products, orders, and users.
- **Secure Payments**: Integrated with eSewa for reliable transactions.
- **Responsive Design**: Optimized for all devices using Tailwind CSS.

## 🛠️ Tech Stack Overview

- **Frontend**: React, Redux Toolkit, Zustand, Tailwind CSS.
- **Backend**: Node.js, Express, MongoDB, Socket.io.
- **Security**: Passport.js (Google OAuth), speakeasy (2FA), Cloudinary.

## 🛠️ Quick Start

To run the entire project locally, you need to start both the backend and frontend.

### 1. Backend Setup
```bash
cd web_backend
npm install
npm run dev
```

### 2. Frontend Setup
```bash
cd web_frontend
npm install
npm run dev
```

## 🛡️ Security Audit
For details on security testing and setup for penetration testing, refer to [BURP_SETUP_GUIDE.md](file:///d:/cw2/BURP_SETUP_GUIDE.md).

## 📄 License
This project is licensed under the ISC License.
