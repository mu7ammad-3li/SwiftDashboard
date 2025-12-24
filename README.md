<div align="center">

# 📊 SwiftDashboard

### Admin Dashboard for SwiftCart E-Commerce Platform

A powerful, real-time admin dashboard for managing your e-commerce operations. Monitor sales, track inventory, manage orders, and analyze customer data—all in one beautiful interface.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple.svg)](https://vitejs.dev/)

[Live Demo](#) · [Report Bug](https://github.com/mu7ammad-3li/SwiftDashboard/issues) · [Request Feature](https://github.com/mu7ammad-3li/SwiftDashboard/issues)

</div>

---

## 📑 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Project Structure](#-project-structure)
- [Available Scripts](#-available-scripts)
- [Dashboard Features](#-dashboard-features)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact](#-contact)

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🎯 Core Features
- **Real-time Analytics**: Live sales and revenue tracking
- **Order Management**: Process and track all customer orders
- **Inventory Control**: Manage products and stock levels
- **Customer Insights**: User behavior and purchase analytics
- **Sales Reports**: Detailed revenue and performance metrics
- **Product Management**: Add, edit, and remove products

</td>
<td width="50%">

### 🔒 Admin Features
- **Role-Based Access**: Secure admin authentication
- **Data Visualization**: Beautiful charts and graphs
- **Responsive Design**: Works perfectly on all devices
- **Real-time Updates**: Live data synchronization
- **Export Reports**: Download data as CSV/PDF
- **Dark Mode**: Eye-friendly interface option

</td>
</tr>
</table>

---

## 🛠 Tech Stack

<div align="center">

### Frontend
![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

### UI Components
![shadcn/ui](https://img.shields.io/badge/shadcn/ui-Latest-000000?style=for-the-badge&logo=shadcnui&logoColor=white)
![Radix UI](https://img.shields.io/badge/Radix_UI-Latest-161618?style=for-the-badge&logo=radixui&logoColor=white)

</div>

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** ([Download](https://nodejs.org/))
- **npm** or **yarn**
- **SwiftCart Backend** (API endpoints required)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/mu7ammad-3li/SwiftDashboard.git
cd SwiftDashboard
```

2. **Install dependencies**
```bash
npm install
```

3. **Create environment file** (optional)

Create a `.env` file in the root directory:

```env
# API Configuration
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000

# App Configuration
VITE_APP_NAME=SwiftDashboard
VITE_APP_VERSION=1.0.0
```

4. **Run the development server**
```bash
npm run dev
```

The dashboard will be running at: **http://localhost:5173**

5. **Build for production**
```bash
npm run build
```

---

## 📁 Project Structure

```
SwiftDashboard/
├── 📂 src/                          # Source code
│   ├── 📂 components/               # React components
│   │   ├── 📂 ui/                  # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── chart.tsx
│   │   │   ├── table.tsx
│   │   │   └── ...
│   │   ├── 📂 dashboard/           # Dashboard components
│   │   │   ├── Overview.tsx
│   │   │   ├── SalesChart.tsx
│   │   │   ├── RecentOrders.tsx
│   │   │   └── Analytics.tsx
│   │   ├── 📂 layout/              # Layout components
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── MainLayout.tsx
│   │   ├── 📂 orders/              # Order management
│   │   │   ├── OrderList.tsx
│   │   │   ├── OrderDetails.tsx
│   │   │   └── OrderStatus.tsx
│   │   ├── 📂 products/            # Product management
│   │   │   ├── ProductList.tsx
│   │   │   ├── ProductForm.tsx
│   │   │   └── ProductTable.tsx
│   │   └── 📂 customers/           # Customer management
│   │       ├── CustomerList.tsx
│   │       └── CustomerDetails.tsx
│   ├── 📂 pages/                   # Page components
│   │   ├── Dashboard.tsx
│   │   ├── Orders.tsx
│   │   ├── Products.tsx
│   │   ├── Customers.tsx
│   │   ├── Analytics.tsx
│   │   └── Settings.tsx
│   ├── 📂 lib/                     # Utilities and configurations
│   │   ├── api.ts                  # API client
│   │   ├── utils.ts                # Helper functions
│   │   └── constants.ts            # Constants
│   ├── 📂 hooks/                   # Custom React hooks
│   │   ├── useOrders.ts
│   │   ├── useProducts.ts
│   │   └── useAnalytics.ts
│   ├── 📂 types/                   # TypeScript type definitions
│   │   ├── order.ts
│   │   ├── product.ts
│   │   └── analytics.ts
│   ├── App.tsx                     # Main application component
│   ├── main.tsx                    # Application entry point
│   └── index.css                   # Global styles
├── 📂 public/                      # Static assets
├── .env                            # Environment variables (create this)
├── .env.example                    # Environment template
├── .gitignore                      # Git ignore rules
├── package.json                    # Dependencies and scripts
├── vite.config.ts                  # Vite configuration
├── tailwind.config.ts              # Tailwind CSS configuration
├── tsconfig.json                   # TypeScript configuration
└── README.md                       # This file
```

---

## 📜 Available Scripts

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Lint code with ESLint
npm run lint
```

---

## 📊 Dashboard Features

### Overview Page
- **Revenue Metrics**: Total sales, revenue, and growth percentages
- **Order Statistics**: Pending, processing, and completed orders
- **Customer Analytics**: New customers, retention rates
- **Quick Actions**: Fast access to common tasks

### Order Management
- **Order List**: View all orders with filtering and sorting
- **Order Details**: Complete order information and timeline
- **Status Updates**: Change order status with notifications
- **Order Search**: Find orders by ID, customer, or date

### Product Management
- **Product Catalog**: View all products with images and details
- **Add/Edit Products**: Comprehensive product form
- **Inventory Tracking**: Stock levels and low-stock alerts
- **Bulk Actions**: Edit multiple products at once

### Analytics & Reports
- **Sales Charts**: Daily, weekly, monthly revenue trends
- **Top Products**: Best-selling items and categories
- **Customer Insights**: Purchase patterns and demographics
- **Export Data**: Download reports as CSV or PDF

### Settings
- **Profile Management**: Update admin profile
- **Notification Preferences**: Configure alerts
- **Theme Settings**: Light/dark mode toggle
- **API Configuration**: Manage API endpoints

---

## 🌐 Deployment

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

### Deploy to Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

### Deploy to Custom Server

```bash
npm run build
# Upload the 'dist' folder to your server
```

---

## 🔗 Integration with SwiftCart

SwiftDashboard is designed to work seamlessly with the SwiftCart e-commerce platform. Ensure that:

1. SwiftCart API is running and accessible
2. CORS is configured to allow dashboard origin
3. Authentication tokens are properly configured
4. WebSocket connections are enabled for real-time updates

---

## 🤝 Contributing

Contributions are what make the open-source community amazing! Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 📧 Contact

**Muhammad Ali**

- GitHub: [@mu7ammad-3li](https://github.com/mu7ammad-3li/)
- Email: muhammad.3lii2@gmail.com
- LinkedIn: [linkedin.com/in/muhammad-3lii](https://linkedin.com/in/muhammad-3lii)

**Project Link**: [https://github.com/mu7ammad-3li/SwiftDashboard](https://github.com/mu7ammad-3li/SwiftDashboard)

---

## 🙏 Acknowledgments

- [React](https://react.dev/) - UI library
- [Vite](https://vitejs.dev/) - Build tool
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Radix UI](https://www.radix-ui.com/) - Headless UI components
- [Recharts](https://recharts.org/) - Chart library

---

<div align="center">

**Built with ❤️ by [Muhammad Ali](https://github.com/mu7ammad-3li/)**

**Part of the SwiftCart Ecosystem**

[⬆ Back to Top](#-swiftdashboard)

</div>
