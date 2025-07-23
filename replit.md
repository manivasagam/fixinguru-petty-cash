# Fixinguru - Petty Cash Management System

## Overview

Fixinguru is a comprehensive petty cash management system designed to streamline expense tracking and approval workflows within organizations. The application provides role-based access control for Admin, Manager, and Staff users, enabling efficient expense submission, approval processes, and financial reporting.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Form Management**: React Hook Form with Zod validation
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL store
- **File Handling**: Multer for receipt uploads
- **API Design**: RESTful endpoints with role-based access control

### Database Design
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Connection**: Neon Database serverless connection
- **Migrations**: Drizzle Kit for schema management
- **Session Storage**: PostgreSQL-based session store

## Key Components

### Authentication System
- **Provider**: Replit Auth integration
- **Authorization**: Role-based access control (Admin, Manager, Staff)
- **Session Management**: Secure session handling with PostgreSQL storage
- **User Management**: Profile management and role assignment

### Expense Management
- **Submission**: Form-based expense submission with receipt upload
- **Approval Workflow**: Multi-level approval process for managers and admins
- **Status Tracking**: Real-time expense status updates
- **Receipt Storage**: File upload and retrieval system

### Reporting System
- **Dashboard**: Role-specific analytics and statistics
- **Filtering**: Advanced filtering by date, category, status, and user
- **Export**: Data export capabilities for reporting
- **Visualizations**: Chart components for expense analytics

### User Interface
- **Design System**: shadcn/ui components with custom theming
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dark Mode**: Theme switching capabilities
- **Accessibility**: ARIA-compliant components

## Data Flow

1. **User Authentication**: Users authenticate via Replit Auth
2. **Expense Submission**: Staff submits expenses with receipts
3. **Approval Workflow**: Managers/Admins review and approve/reject expenses
4. **Data Persistence**: All data stored in PostgreSQL with Drizzle ORM
5. **Real-time Updates**: TanStack Query provides optimistic updates and caching
6. **File Management**: Receipts uploaded to server filesystem

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI primitives
- **react-hook-form**: Form validation and management
- **zod**: Runtime type validation

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type checking and compilation
- **tailwindcss**: Utility-first CSS framework
- **@replit/vite-plugin-cartographer**: Replit development integration

### File Upload
- **multer**: File upload middleware
- **File Storage**: Local filesystem storage for receipts
- **File Validation**: Type and size restrictions for uploads

## Deployment Strategy

### Development Environment
- **Local Development**: Vite development server with hot reload
- **Database**: Neon Database connection via environment variables
- **Authentication**: Replit Auth development configuration

### Production Build
- **Client Build**: Vite optimized production build
- **Server Build**: ESBuild for Node.js server compilation
- **Static Assets**: Served via Express static middleware
- **Environment Variables**: Database URL and session secrets

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string
- **SESSION_SECRET**: Session encryption key
- **REPLIT_DOMAINS**: Allowed domains for authentication
- **ISSUER_URL**: OpenID Connect issuer URL

## Deployment

### Framework & Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js + TypeScript 
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth (OpenID Connect)
- **Deployment**: Configured for Vercel via GitHub

### Vercel Deployment Setup
- **Configuration**: `vercel.json` configured for serverless deployment
- **Build Process**: Frontend builds to `dist/`, backend runs as serverless function
- **Environment Variables**: `.env.example` provides required variables template
- **Documentation**: Complete deployment guide in `DEPLOYMENT.md`

### Key Requirements for Production
- PostgreSQL database (Neon/Supabase recommended)
- Replit Auth configuration with production domains
- Session secret for secure authentication
- File upload handling (Vercel Blob recommended for production)

## Changelog

Recent Changes:
- July 22, 2025: Added complete Vercel deployment configuration with vercel.json, environment setup, comprehensive deployment guide, and GitHub-ready repository structure
- July 22, 2025: Added date field to Cash Top-up functionality with calendar picker and backend date handling
- July 22, 2025: Added export functionality to Expense History - workers can now export CSV and print expense reports with professional formatting
- July 22, 2025: Added Reset Cash Top-ups feature for admins to reset all worker balances to zero
- July 22, 2025: Fixed Add User functionality - added complete user creation system with POST /api/users endpoint, form validation, and automatic user balance initialization
- July 22, 2025: Fixed null/undefined category access errors across Dashboard, ExpenseHistory, Reports, Approvals, and ExpenseModal components
- July 22, 2025: Fixed cash transfer tracking system - cash given by managers/admins now properly shows in worker dashboards and transactions
- July 22, 2025: Added PDF invoice/receipt upload support for all workers (10MB limit for PDFs, 5MB for images)
- July 22, 2025: Fixed login/logout functionality with proper session management and routing
- July 04, 2025: Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.