# Vercel Deployment Guide for Fixinguru Petty Cash Management System

## 🚀 **Quick Deployment Steps**

### **Step 1: Database Setup**
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the entire content from `scripts/setup-database.sql`
4. Click **"Run"** to create all tables and insert demo data

### **Step 2: Environment Variables (Vercel)**
Add these environment variables in Vercel Dashboard → Settings → Environment Variables:

```bash
# Database
DATABASE_URL=postgresql://postgres:mgkjS7BrQ8ZB7gV9@db.wzozrtwtxqxgjvencnrv.supabase.co:5432/postgres

# Session Management
SESSION_SECRET=fixinguru-production-secure-secret-key-2025-vercel

# App Configuration
NODE_ENV=production
```

### **Step 3: Update GitHub Files**
Upload/update these files to your GitHub repository:

1. **`vercel.json`** (updated configuration)
2. **`api/index.ts`** (serverless function entry point)  
3. **`api/uploads/[...path].ts`** (file serving endpoint)
4. **`vercel-build.js`** (custom build script)
5. **`scripts/setup-database.sql`** (database setup)

### **Step 4: Deploy**
1. Go to Vercel Dashboard → Your Project → Deployments
2. Click **"Redeploy"** 
3. Wait for deployment to complete

## 📝 **Key Changes for Vercel Compatibility**

### **✅ Authentication System**
- **Removed**: Replit Auth dependency
- **Added**: Simple password-based authentication (`fix098765` for all users)
- **Improved**: PostgreSQL session storage instead of memory store

### **✅ File Upload System**  
- **Enhanced**: Proper file serving through API endpoints
- **Secured**: Path validation and access controls
- **Optimized**: 10MB file size limits for receipts/invoices

### **✅ Database Configuration**
- **Streamlined**: Direct PostgreSQL connection via Supabase
- **Automated**: Database schema setup via SQL script
- **Optimized**: Proper indexing and performance tuning

### **✅ Deployment Configuration**
- **Custom Build**: `vercel-build.js` for optimized builds
- **Serverless**: Proper function configuration with timeouts
- **CORS**: Production-ready cross-origin settings

## 🔧 **Architecture Overview**

```
Frontend (React + Vite)
├── Built to /dist
└── Served as static files

Backend (Express.js)
├── api/index.ts (Serverless function)
├── PostgreSQL Sessions (Supabase)
└── File uploads via API endpoints

Database (Supabase PostgreSQL)
├── User management & authentication
├── Expense tracking & approvals
├── Cash allocation & balances
└── Session storage
```

## 🏢 **Demo Users & Credentials**

All users use password: **`fix098765`**

| Email | Role | Department |
|-------|------|------------|
| `admin@fixinguru.sg` | Admin | Management |
| `mrmanivasagam@gmail.com` | Admin | Management |
| `manager@fixinguru.sg` | Manager | Operations |
| `staff1@fixinguru.sg` | Staff | Field Operations |
| `staff2@fixinguru.sg` | Staff | Technical |
| `staff3@fixinguru.sg` | Staff | Field Operations |
| `staff4@fixinguru.sg` | Staff | Technical |

## 🎯 **Features**

### **Role-Based Access Control**
- **Workers**: See only their own expenses and balance
- **Managers/Admins**: See all expenses and team analytics

### **Immediate Expense Deduction**
- Expenses deduct from balance immediately when submitted
- Real-time balance tracking across all operations

### **Advanced File Upload**
- Support for images (JPEG, PNG, GIF) up to 5MB
- Support for PDF invoices/receipts up to 10MB
- Secure file serving with access controls

### **Comprehensive Reporting**
- Dashboard analytics with date filtering
- CSV export capabilities for expense history
- Category-wise spending analysis

## 🛠️ **Production Optimization**

### **Security**
- HTTPS-only cookies in production
- CORS configured for your domain
- SQL injection protection via Drizzle ORM

### **Performance**
- Database indexing for fast queries
- Optimized session storage
- Efficient file serving

### **Scalability**
- Serverless architecture on Vercel
- PostgreSQL connection pooling
- Stateless session management

## 🔄 **Maintenance**

### **Adding New Users**
```sql
INSERT INTO users (id, email, first_name, last_name, role, department, is_active) 
VALUES ('new-user-id', 'user@fixinguru.sg', 'First', 'Last', 'staff', 'Department', true);

INSERT INTO user_balances (user_id, total_allocated, total_spent, pending_amount, current_balance) 
VALUES ('new-user-id', 0, 0, 0, 0);
```

### **Updating Categories**
```sql
INSERT INTO categories (name, description) 
VALUES ('New Category', 'Category description');
```

## 📊 **Monitoring**

### **Health Check**
- Endpoint: `https://your-app.vercel.app/api/health`
- Returns: `{"status": "OK", "timestamp": "..."}`

### **Logs**
- Access logs through Vercel Dashboard → Functions → View Function Logs
- Database logs through Supabase Dashboard → Logs

---

✅ **Ready for Production**: This configuration is optimized for Vercel deployment with enterprise-grade security and scalability features.