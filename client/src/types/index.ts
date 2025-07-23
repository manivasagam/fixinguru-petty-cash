export interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  role: 'admin' | 'manager' | 'staff';
  department: string | null;
  isActive: boolean;
  balance?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithStats extends User {
  totalExpenses?: number;
  approvedExpenses?: number;
  pendingExpenses?: number;
  rejectedExpenses?: number;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
}

export interface Expense {
  id: number;
  userId: string;
  categoryId: number;
  amount: string;
  description: string;
  remarks: string | null;
  receiptUrl: string | null;
  expenseDate: Date;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectionReason: string | null;
  hasGst: boolean;
  gstAmount: string | null;
  totalAmount: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpenseWithDetails extends Expense {
  user: User;
  category: Category;
  approver?: User;
}

export interface CashTopUp {
  id: number;
  userId: string;
  amount: string;
  source: string;
  reference: string | null;
  remarks: string | null;
  createdAt: Date;
}

export interface DashboardStats {
  totalCashIn: number;
  totalBalance: number;
  totalSpent: number;
  pendingExpenses: number;
  thisMonthExpenses: number;
  totalExpensesCount: number;
  pendingApprovalsCount: number;
  categoryBreakdown?: Array<{
    categoryId: number;
    categoryName: string;
    totalSpent: number;
    expenseCount: number;
  }>;
}

export interface ExpenseFilters {
  categoryId?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  userId?: string;
}

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  categoryId?: number;
  status?: string;
}
