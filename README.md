# Fixinguru - Petty Cash Management System

A comprehensive petty cash management system designed to streamline expense tracking and approval workflows within organizations. The application provides role-based access control for Admin, Manager, and Staff users, enabling efficient expense submission, approval processes, and financial reporting.

## Features

### Core Functionality
- **Role-based Access Control**: Admin, Manager, and Staff user roles with appropriate permissions
- **Expense Management**: Submit, track, and approve expenses with receipt uploads
- **Cash Allocation**: Admins can allocate cash to technicians with date tracking
- **Real-time Balance Tracking**: Immediate expense deduction from user balances
- **Receipt Upload**: Support for images (JPG, PNG) and PDF invoices/receipts
- **GST Calculations**: Automatic GST calculation and tracking
- **Date Filtering**: Dashboard filtering by Last 7 Days, This Month, Last Month, or Custom Date

### User Roles & Permissions
- **Staff**: Submit expenses, view own transactions and balance
- **Manager**: Approve expenses, view team reports, allocate cash
- **Admin**: Full system access, user management, reset balances

### Technical Features
- **Mobile-first Design**: Responsive UI optimized for mobile devices
- **Export Functionality**: CSV export and print reports for expense history
- **Advanced Filtering**: Filter expenses by date, category, status, and user
- **Real-time Updates**: Live balance and expense status updates

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling and development
- Tailwind CSS with shadcn/ui components
- Wouter for lightweight routing
- TanStack Query for server state management
- React Hook Form with Zod validation

### Backend
- Express.js with TypeScript
- PostgreSQL database with Drizzle ORM
- Replit Auth with OpenID Connect
- Express sessions with PostgreSQL store
- Multer for file uploads
- RESTful API with role-based access control

### Database
- PostgreSQL with Neon Database serverless connection
- Drizzle ORM for type-safe database operations
- Automated schema migrations with Drizzle Kit

## Environment Variables

Required environment variables for deployment:

```env
DATABASE_URL=postgresql://...
SESSION_SECRET=your-session-secret
REPLIT_DOMAINS=your-domain.com
ISSUER_URL=https://replit.com/oidc
REPL_ID=your-repl-id
```

## Deployment

### Vercel Deployment

1. **Fork or clone this repository**
2. **Connect to Vercel**:
   - Import your GitHub repository to Vercel
   - Configure environment variables in Vercel dashboard
3. **Database Setup**:
   - Ensure your PostgreSQL database is accessible from Vercel
   - Run `npm run db:push` to apply schema changes
4. **Build Configuration**:
   - Vercel will automatically detect the build configuration from `vercel.json`
   - The app will build both frontend and backend automatically

### Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   - Copy `.env.example` to `.env`
   - Fill in your database URL and other required variables

3. **Initialize database**:
   ```bash
   npm run db:push
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

## API Endpoints

### Authentication
- `GET /api/auth/user` - Get current user
- `GET /api/login` - Initiate login flow
- `GET /api/logout` - Logout user

### Expenses
- `GET /api/expenses` - Get user expenses (filtered by role)
- `POST /api/expenses` - Submit new expense
- `PUT /api/expenses/:id/status` - Approve/reject expense

### User Management (Admin only)
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id/role` - Update user role

### Cash Management
- `POST /api/add-cash` - Allocate cash to user
- `GET /api/user-balance/:userId` - Get user balance
- `POST /api/reset-balances` - Reset all balances (Admin only)

### Reports
- `GET /api/reports/expenses` - Generate expense reports
- `GET /api/reports/expenses/csv` - Export expenses as CSV

## Categories

The system includes 8 predefined expense categories:
- Materials
- Petrol
- Parking
- Cash Card
- Cleaning Items
- Disposal Fee
- Food
- Others

## License

This project is proprietary software developed for Fixinguru company.