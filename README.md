# Mini ERP + CRM Operations Portal

A complete, production-ready Full Stack Operations Management Portal designed for wholesale and distribution companies. Built with React, TypeScript, Vite, Node.js, Express, PostgreSQL, and Prisma ORM.

---

## 1. Project Overview
The **Mini ERP + CRM Operations Portal** automates core business workflows for wholesale businesses. It equips internal employees (Admin, Sales, Warehouse, Accounts) to manage customer relationship CRM records, maintain product catalog stock levels, record inward/outward inventory movements, and generate sales challans with automatic, transactional stock deduction.

---

## 2. Business Problem
Wholesale and distribution companies deal with high-volume stock dispatch. Manually issuing delivery slips often leads to stock mismatch, negative stock anomalies, or unfulfilled orders due to lack of stock validation. This portal solves these challenges by:
- Enforcing **ACID database transactions** for stock deduction.
- Providing **historical price and product snapshots** inside sales challans so price or name changes never distort past orders.
- Rejecting challan confirmation with **HTTP 400 Insufficient Stock** errors whenever requested quantities exceed available stock.

---

## 3. Features
- **Authentication & RBAC**: JWT-based security with 4 test user roles (`ADMIN`, `SALES`, `WAREHOUSE`, `ACCOUNTS`).
- **Customer CRM**: Complete customer directory, type classification (`RETAIL`, `WHOLESALE`, `DISTRIBUTOR`), status tracking (`LEAD`, `ACTIVE`, `INACTIVE`), and interactive follow-up interaction notes.
- **Product Management**: SKU uniqueness, minimum stock alert indicators, warehouse location tracking, and price/stock constraints.
- **Inventory Audit Log**: Real-time stock movement tracking (`IN` / `OUT`) with complete audit trails.
- **Sales Challans**: Save as `DRAFT` (without affecting stock) or `CONFIRM` (transactional stock deduction & `OUT` movement generation).
- **Snapshot Preservation**: Challan line items preserve product names, SKUs, and unit prices as immutable snapshots.
- **Operations Dashboard**: Visual summary metrics, recent sales challans, low stock alert widgets, and recent stock movements log.

---

## 4. Tech Stack
- **Frontend**: React 18, TypeScript, Vite, React Router v6, Tailwind CSS, Axios, Lucide React Icons.
- **Backend**: Node.js, TypeScript, Express.js, JWT, bcryptjs, Zod Validation, Helmet, CORS.
- **Database & ORM**: PostgreSQL, Prisma ORM.
- **Testing**: Jest, Supertest.
- **DevOps & Containers**: Docker, Docker Compose.

---

## 5. Architecture
```
┌────────────────────────────────┐       REST APIs / JWT       ┌─────────────────────────────────┐
│     React + TypeScript UI      │ ──────────────────────────> │   Express.js + TypeScript API   │
│  (Vite + Tailwind CSS + Axios) │ <────────────────────────── │    (Zod Validation & RBAC)    │
└────────────────────────────────┘                             └─────────────────────────────────┘
                                                                                │
                                                                   Prisma ORM & Transactions
                                                                                │
                                                                                ▼
                                                               ┌─────────────────────────────────┐
                                                               │       PostgreSQL Database       │
                                                               └─────────────────────────────────┘
```

---

## 6. Folder Structure
```
erp-crm/
├── backend/
│   ├── src/
│   │   ├── config/          # Prisma client & Environment config
│   │   ├── controllers/     # Auth, Customer, Product, Stock, Challan, Dashboard
│   │   ├── middleware/      # JWT requireAuth, requireRole, Error Handler
│   │   ├── routes/          # Express route definitions
│   │   ├── services/        # Business logic & stock transactions
│   │   ├── validators/      # Zod validation schemas
│   │   ├── app.ts           # Express application setup
│   │   └── server.ts        # Server entry point
│   ├── prisma/
│   │   ├── schema.prisma    # PostgreSQL Schema
│   │   └── seed.ts          # Seeding script with demo users and data
│   ├── tests/               # Integration tests (Jest & Supertest)
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components & layouts
│   │   ├── context/         # AuthContext
│   │   ├── pages/           # Views for Login, Dashboard, Customers, Products, Inventory, Challans
│   │   ├── services/        # Axios API client
│   │   ├── types/           # Shared TypeScript interfaces
│   │   ├── App.tsx          # Application router
│   │   └── main.tsx         # DOM entry point
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.ts
├── docs/
│   └── postman/
│       └── Mini_ERP_CRM_Collection.json
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 7. Database Schema
- **User**: `id`, `name`, `email` (unique), `password`, `role` (`ADMIN` | `SALES` | `WAREHOUSE` | `ACCOUNTS`).
- **Customer**: `id`, `customerName`, `mobileNumber`, `email`, `businessName`, `gstNumber`, `customerType`, `address`, `status`, `followUpDate`, `notes`.
- **FollowUp**: `id`, `customerId`, `notes`, `followUpDate`, `createdById`.
- **Product**: `id`, `productName`, `sku` (unique), `category`, `unitPrice`, `currentStock`, `minimumStock`, `warehouseLocation`.
- **StockMovement**: `id`, `productId`, `quantity`, `movementType` (`IN` | `OUT`), `reason`, `createdById`.
- **Challan**: `id`, `challanNumber` (unique), `customerId`, `totalQuantity`, `status` (`DRAFT` | `CONFIRMED` | `CANCELLED`), `createdById`.
- **ChallanItem**: `id`, `challanId`, `productId`, `productNameSnapshot`, `skuSnapshot`, `unitPriceSnapshot`, `quantity`.

---

## 8. API Documentation

### Authentication
- `POST /api/auth/login` - Authenticate user & get JWT token.
- `GET /api/auth/me` - Fetch authenticated user profile.

### Customer CRM
- `GET /api/customers` - List customers (supports `page`, `limit`, `search`, `type`, `status`).
- `POST /api/customers` - Create customer (Requires `ADMIN` or `SALES`).
- `GET /api/customers/:id` - Customer details with follow-up history.
- `PUT /api/customers/:id` - Update customer record.
- `DELETE /api/customers/:id` - Delete customer (Requires `ADMIN`).
- `GET /api/customers/:id/followups` - Get follow-up notes.
- `POST /api/customers/:id/followups` - Add follow-up note.

### Product Management
- `GET /api/products` - List products (supports `page`, `limit`, `search`, `category`, `lowStock`).
- `POST /api/products` - Create product with unique SKU (Requires `ADMIN` or `WAREHOUSE`).
- `GET /api/products/:id` - Product detail & recent movements.
- `PUT /api/products/:id` - Update product.

### Stock & Inventory
- `GET /api/stock/movements` - List stock movements (`IN`/`OUT`).
- `POST /api/stock/movements` - Record manual stock adjustment (`IN` or `OUT`).

### Sales Challan & Business Logic
- `GET /api/challans` - List sales challans.
- `POST /api/challans` - Create sales challan (`DRAFT` or `CONFIRMED`).
- `GET /api/challans/:id` - Detailed challan view with snapshot data.
- `PUT /api/challans/:id` - Update draft challan line items.
- `PUT /api/challans/:id/confirm` - Confirm draft challan & trigger stock deduction transaction.
- `PUT /api/challans/:id/cancel` - Cancel draft challan.

### Dashboard
- `GET /api/dashboard/stats` - Summary cards, low stock alerts, recent challans & stock movements.

---

## 9. Authentication
JWT authentication is implemented using standard HTTP Bearer headers (`Authorization: Bearer <token>`). Passwords are securely hashed using `bcryptjs` with 10 rounds of salting.

---

## 10. Role Permissions Matrix

| Module / Action | ADMIN | SALES | WAREHOUSE | ACCOUNTS |
|:---|:---:|:---:|:---:|:---:|
| Dashboard View | ✅ | ✅ | ✅ | ✅ |
| Customer CRUD | ✅ | ✅ | ❌ | View Only |
| Product CRUD | ✅ | View Only | ✅ | View Only |
| Manage Stock Movements | ✅ | ❌ | ✅ | View Only |
| Create / Confirm Challan | ✅ | ✅ | View Only | View Only |

---

## 11. Local Setup
1. **Clone Repository**:
   ```bash
   git clone <repository-url>
   cd "Full Stack Developer Case Study"
   ```
2. **Environment File Configuration**:
   Create `.env` inside `backend/` directory or root based on `.env.example`.

---

## 12. Environment Variables

### Backend (`backend/.env`)
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/minierp_db?schema=public"
JWT_SECRET="super-secret-jwt-key-minierp-2026"
PORT=5000
FRONTEND_URL="http://localhost:5173"
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL="http://localhost:5000/api"
```

---

## 13. Database Migration
Navigate to `backend/` and run Prisma database setup:
```bash
cd backend
npm install
npx prisma db push
```

---

## 14. Seed Data
Seed the database with pre-configured users for all 4 roles, 8 customers, 12 products (normal, low stock, out of stock), initial movements, and sample challans:
```bash
npm run seed
```

### Seed Credentials
- **Admin**: `admin@example.com` / `Admin@123`
- **Sales**: `sales@example.com` / `Sales@123`
- **Warehouse**: `warehouse@example.com` / `Warehouse@123`
- **Accounts**: `accounts@example.com` / `Accounts@123`

---

## 15. Running Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs locally at `http://localhost:5173`.

---

## 16. Running Backend
```bash
cd backend
npm run dev
```
Backend API runs locally at `http://localhost:5000`.

---

## 17. Testing
Backend business logic integration tests are written with **Jest & Supertest**.
To execute tests:
```bash
cd backend
npm test
```
Tests cover:
1. Valid login returning JWT.
2. Invalid login returning HTTP 401.
3. Customer creation & validation.
4. Product creation with unique SKU.
5. Draft challan creation without stock reduction.
6. Confirmed challan execution reducing stock & generating OUT movement.
7. Insufficient stock rejection returning HTTP 400 error.
8. Non-negative stock enforcement.
9. Role-based authorization enforcement.

---

## 18. Postman Collection
Import the Postman collection located at:
`/docs/postman/Mini_ERP_CRM_Collection.json`

Includes pre-configured requests for Auth, Customers, Products, Stock Movements, Challans, and Dashboard metrics.

---

## 19. Deployment
- **Frontend Target**: Vercel (Set environment variable `VITE_API_URL` to Render backend API endpoint).
- **Backend Target**: Render (Set environment variables `DATABASE_URL`, `JWT_SECRET`, `PORT`).
- **Database Target**: Neon or Supabase PostgreSQL.

---

## 20. Assumptions
- All monetary unit prices are handled in INR (₹).
- Product SKUs are uppercase alphanumeric codes.
- Confirmed challans cannot be deleted or un-confirmed to prevent inventory audit trail tampering.

---

## 21. Known Limitations
- Automatic currency conversions or tax calculation rules outside standard GST are not included.
- Batch/Lot serial number tracking is simplified to SKU level.

---

## 22. Future Improvements
- PDF invoice generation and direct download for confirmed challans.
- AWS S3 integration for uploading product image media.
- Automated email alerts for low-stock products sent to warehouse managers.
