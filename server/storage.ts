import {
  users,
  categories,
  expenses,
  cashTopUps,
  userBalances,
  type User,
  type UpsertUser,
  type Category,
  type InsertCategory,
  type Expense,
  type InsertExpense,
  type ExpenseWithDetails,
  type CashTopUp,
  type InsertCashTopUp,
  type UserBalance,
  type InsertUserBalance,
  type UpdateExpenseStatus,
  type UserWithStats,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql, count, sum, like, or } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Additional user operations
  getAllUsers(): Promise<UserWithStats[]>;
  createUser(userData: any): Promise<User>;
  updateUserRole(id: string, role: string): Promise<User>;
  toggleUserStatus(id: string): Promise<User>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<Category>): Promise<Category>;
  
  // Expense operations
  getExpenses(filters?: {
    userId?: string;
    categoryId?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<ExpenseWithDetails[]>;
  getExpenseById(id: number): Promise<ExpenseWithDetails | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpenseStatus(id: number, status: UpdateExpenseStatus, approvedBy: string): Promise<Expense>;
  
  // Cash top-up operations
  getCashTopUps(): Promise<CashTopUp[]>;
  createCashTopUp(topUp: InsertCashTopUp): Promise<CashTopUp>;
  
  // User balance operations
  getUserBalance(userId: string): Promise<UserBalance | undefined>;
  createUserBalance(balance: InsertUserBalance): Promise<UserBalance>;
  updateUserBalance(userId: string, balance: Partial<UserBalance>): Promise<UserBalance>;
  addCashToUser(userId: string, amount: number, giverId?: string, giverName?: string, date?: string): Promise<UserBalance>;
  
  // Dashboard statistics
  getDashboardStats(userId?: string, userRole?: string, dateFilter?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
    totalCashIn: number;
    totalBalance: number;
    totalSpent: number;
    pendingExpenses: number;
    thisMonthExpenses: number;
    totalExpensesCount: number;
    pendingApprovalsCount: number;
  }>;
  
  getUserWiseStats(dateFilter?: {
    startDate?: string;
    endDate?: string;
  }): Promise<UserWithStats[]>;
  
  // Reports
  getExpenseReport(filters?: {
    startDate?: string;
    endDate?: string;
    categoryId?: number;
    status?: string;
  }): Promise<ExpenseWithDetails[]>;
  
  // Reset worker cash top-ups
  resetAllWorkerCashTopUps(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Additional user operations
  async getAllUsers(): Promise<UserWithStats[]> {
    const usersWithStats = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        role: users.role,
        department: users.department,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        balance: userBalances.currentBalance,
        totalExpenses: count(expenses.id),
        approvedExpenses: sql<number>`count(case when ${expenses.status} = 'approved' then 1 end)`,
        pendingExpenses: sql<number>`count(case when ${expenses.status} = 'pending' then 1 end)`,
        rejectedExpenses: sql<number>`count(case when ${expenses.status} = 'rejected' then 1 end)`,
      })
      .from(users)
      .leftJoin(expenses, eq(users.id, expenses.userId))
      .leftJoin(userBalances, eq(users.id, userBalances.userId))
      .groupBy(users.id, userBalances.currentBalance)
      .orderBy(users.createdAt);
    
    return usersWithStats.map(user => ({
      ...user,
      password: null, // Exclude password from response
    })) as UserWithStats[];
  }

  async updateUserRole(id: string, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role: role as any, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async createUser(userData: any): Promise<User> {
    // Set default password for new users
    const userDataWithPassword = {
      ...userData,
      password: 'fix098765' // Default password for all users
    };
    
    const [user] = await db
      .insert(users)
      .values(userDataWithPassword)
      .returning();
    
    // Create initial user balance record
    await db.insert(userBalances).values({
      userId: user.id,
      totalAllocated: "0",
      totalSpent: "0",
      pendingAmount: "0",
      currentBalance: "0"
    });
    
    return user;
  }

  async toggleUserStatus(id: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        isActive: sql`NOT ${users.isActive}`,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.isActive, true));
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db
      .insert(categories)
      .values(category)
      .returning();
    return newCategory;
  }

  async updateCategory(id: number, category: Partial<Category>): Promise<Category> {
    const [updatedCategory] = await db
      .update(categories)
      .set(category)
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }

  // Expense operations
  async getExpenses(filters?: {
    userId?: string;
    categoryId?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<ExpenseWithDetails[]> {
    // Get all expenses first
    const allExpenses = await db.select().from(expenses);
    
    // Filter in memory for now to avoid Drizzle typing issues
    let filteredExpenses = allExpenses;
    
    if (filters?.userId) {
      filteredExpenses = filteredExpenses.filter(expense => expense.userId === filters.userId);
    }
    
    if (filters?.categoryId) {
      filteredExpenses = filteredExpenses.filter(expense => expense.categoryId === filters.categoryId);
    }
    
    if (filters?.status) {
      filteredExpenses = filteredExpenses.filter(expense => expense.status === filters.status);
    }
    
    if (filters?.startDate) {
      const startDate = new Date(filters.startDate);
      filteredExpenses = filteredExpenses.filter(expense => expense.expenseDate >= startDate);
    }
    
    if (filters?.endDate) {
      const endDate = new Date(filters.endDate);
      filteredExpenses = filteredExpenses.filter(expense => expense.expenseDate <= endDate);
    }
    
    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredExpenses = filteredExpenses.filter(expense => 
        expense.description.toLowerCase().includes(searchTerm) ||
        (expense.remarks && expense.remarks.toLowerCase().includes(searchTerm))
      );
    }
    
    // Sort by created date (newest first)
    filteredExpenses.sort((a, b) => {
      const aTime = a.createdAt ? a.createdAt.getTime() : 0;
      const bTime = b.createdAt ? b.createdAt.getTime() : 0;
      return bTime - aTime;
    });
    
    // Get related data for each expense
    const expensesWithDetails = await Promise.all(
      filteredExpenses.map(async (expense) => {
        // Get user
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, expense.userId));
        
        // Get category
        const [category] = await db
          .select()
          .from(categories)
          .where(eq(categories.id, expense.categoryId));
        
        // Get approver if exists
        let approver = undefined;
        if (expense.approvedBy) {
          const [approverUser] = await db
            .select()
            .from(users)
            .where(eq(users.id, expense.approvedBy));
          approver = approverUser;
        }
        
        return {
          ...expense,
          user: user!,
          category: category!,
          approver,
        };
      })
    );

    return expensesWithDetails;
  }

  // Role-based dashboard stats
  async getDashboardStats(userId: string, userRole: string, dateFilter?: {
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    const isStaff = userRole === 'staff';
    
    if (isStaff) {
      // Staff sees only their own data
      let whereClause: any = eq(expenses.userId, userId);
      
      // Apply date filter if provided
      if (dateFilter?.startDate && dateFilter?.endDate) {
        const startDate = new Date(dateFilter.startDate);
        const endDate = new Date(dateFilter.endDate);
        whereClause = and(
          whereClause,
          gte(expenses.expenseDate, startDate),
          lte(expenses.expenseDate, endDate)
        );
      }
      
      const userExpenses = await db.select().from(expenses).where(whereClause);

      const userCashTopups = await db
        .select()
        .from(cashTopUps)
        .where(eq(cashTopUps.userId, userId));

      const totalCashIn = userCashTopups.reduce((sum, topup) => sum + parseFloat(topup.amount), 0);
      
      // Calculate total spent from all expenses (including GST)
      const totalSpent = userExpenses.reduce((sum, exp) => {
        const baseAmount = parseFloat(exp.amount);
        const gstAmount = exp.hasGst && exp.gstAmount ? parseFloat(exp.gstAmount) : 0;
        return sum + baseAmount + gstAmount;
      }, 0);
      
      // Pending expenses for display only
      const pendingExpenses = userExpenses
        .filter(exp => exp.status === 'pending')
        .reduce((sum, exp) => {
          const baseAmount = parseFloat(exp.amount);
          const gstAmount = exp.hasGst && exp.gstAmount ? parseFloat(exp.gstAmount) : 0;
          return sum + baseAmount + gstAmount;
        }, 0);

      // Get category breakdown for staff
      const categoryBreakdown = await this.getCategoryBreakdown(userId);

      return {
        totalCashIn,
        totalBalance: totalCashIn - totalSpent,
        totalSpent,
        pendingExpenses,
        thisMonthExpenses: userExpenses.filter(exp => {
          const expenseMonth = new Date(exp.expenseDate).getMonth();
          const currentMonth = new Date().getMonth();
          return expenseMonth === currentMonth;
        }).reduce((sum, exp) => {
          const baseAmount = parseFloat(exp.amount);
          const gstAmount = exp.hasGst && exp.gstAmount ? parseFloat(exp.gstAmount) : 0;
          return sum + baseAmount + gstAmount;
        }, 0),
        totalExpensesCount: userExpenses.length,
        pendingApprovalsCount: 0, // Staff doesn't approve
        categoryBreakdown
      };
    } else {
      // Admin/Manager sees system-wide data
      let whereClause = undefined;
      
      // Apply date filter if provided
      if (dateFilter?.startDate && dateFilter?.endDate) {
        const startDate = new Date(dateFilter.startDate);
        const endDate = new Date(dateFilter.endDate);
        whereClause = and(
          gte(expenses.expenseDate, startDate),
          lte(expenses.expenseDate, endDate)
        );
      }
      
      const allExpenses = whereClause 
        ? await db.select().from(expenses).where(whereClause)
        : await db.select().from(expenses);
      const allCashTopups = await db.select().from(cashTopUps);

      const totalCashIn = allCashTopups.reduce((sum, topup) => sum + parseFloat(topup.amount), 0);
      
      // Calculate total spent from all expenses (including GST)
      const totalSpent = allExpenses.reduce((sum, exp) => {
        const baseAmount = parseFloat(exp.amount);
        const gstAmount = exp.hasGst && exp.gstAmount ? parseFloat(exp.gstAmount) : 0;
        return sum + baseAmount + gstAmount;
      }, 0);
      
      // Pending expenses for display only
      const pendingExpenses = allExpenses
        .filter(exp => exp.status === 'pending')
        .reduce((sum, exp) => {
          const baseAmount = parseFloat(exp.amount);
          const gstAmount = exp.hasGst && exp.gstAmount ? parseFloat(exp.gstAmount) : 0;
          return sum + baseAmount + gstAmount;
        }, 0);

      // Get category breakdown for admin/manager
      const categoryBreakdown = await this.getCategoryBreakdown();

      return {
        totalCashIn,
        totalBalance: totalCashIn - totalSpent,
        totalSpent,
        pendingExpenses,
        thisMonthExpenses: allExpenses.filter(exp => {
          const expenseMonth = new Date(exp.expenseDate).getMonth();
          const currentMonth = new Date().getMonth();
          return expenseMonth === currentMonth;
        }).reduce((sum, exp) => {
          const baseAmount = parseFloat(exp.amount);
          const gstAmount = exp.hasGst && exp.gstAmount ? parseFloat(exp.gstAmount) : 0;
          return sum + baseAmount + gstAmount;
        }, 0),
        totalExpensesCount: allExpenses.length,
        pendingApprovalsCount: allExpenses.filter(exp => exp.status === 'pending').length,
        categoryBreakdown
      };
    }
  }

  async getCategoryBreakdown(userId?: string): Promise<any[]> {
    // Build query to get expenses with categories
    let query = db
      .select({
        categoryId: expenses.categoryId,
        categoryName: categories.name,
        amount: expenses.amount,
        gstAmount: expenses.gstAmount,
        hasGst: expenses.hasGst
      })
      .from(expenses)
      .leftJoin(categories, eq(expenses.categoryId, categories.id));

    // Filter by user if provided (for staff view)
    if (userId) {
      query = query.where(eq(expenses.userId, userId)) as typeof query;
    }

    const expenseData = await query;

    // Group by category and calculate totals
    const categoryMap = new Map();
    
    expenseData.forEach(expense => {
      const categoryId = expense.categoryId;
      const categoryName = expense.categoryName || 'Unknown';
      const baseAmount = parseFloat(expense.amount);
      const gstAmount = expense.hasGst && expense.gstAmount ? parseFloat(expense.gstAmount) : 0;
      const totalAmount = baseAmount + gstAmount;

      if (categoryMap.has(categoryId)) {
        const existing = categoryMap.get(categoryId);
        existing.totalSpent += totalAmount;
        existing.expenseCount += 1;
      } else {
        categoryMap.set(categoryId, {
          categoryId,
          categoryName,
          totalSpent: totalAmount,
          expenseCount: 1
        });
      }
    });

    // Convert to array and sort by total spent (descending)
    return Array.from(categoryMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent);
  }

  async getExpenseById(id: number): Promise<ExpenseWithDetails | undefined> {
    const [result] = await db
      .select()
      .from(expenses)
      .leftJoin(users, eq(expenses.userId, users.id))
      .leftJoin(categories, eq(expenses.categoryId, categories.id))
      .leftJoin(users, eq(expenses.approvedBy, users.id))
      .where(eq(expenses.id, id));

    if (!result) return undefined;

    return {
      ...result.expenses,
      user: result.users!,
      category: result.categories!,
      approver: result.users || undefined,
    };
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const [newExpense] = await db
      .insert(expenses)
      .values(expense)
      .returning();
    
    // Update user balance when expense is created - calculate total amount
    const baseAmount = parseFloat(expense.amount);
    const gstAmount = expense.hasGst && expense.gstAmount ? parseFloat(expense.gstAmount) : 0;
    const totalAmount = baseAmount + gstAmount;
    await this.updateUserBalanceOnExpense(expense.userId, totalAmount);
    
    return newExpense;
  }

  async updateUserBalanceOnExpense(userId: string, amount: number): Promise<void> {
    let userBalance = await this.getUserBalance(userId);
    
    if (!userBalance) {
      // Create balance if doesn't exist
      userBalance = await this.createUserBalance({
        userId,
        totalAllocated: "0",
        totalSpent: amount.toString(),
        pendingAmount: amount.toString(),
        currentBalance: (-amount).toString(),
      });
    } else {
      const newSpent = parseFloat(userBalance.totalSpent) + amount;
      const newPending = parseFloat(userBalance.pendingAmount) + amount;
      const newBalance = parseFloat(userBalance.currentBalance) - amount;
      
      await this.updateUserBalance(userId, {
        totalSpent: newSpent.toString(),
        pendingAmount: newPending.toString(),
        currentBalance: newBalance.toString(),
      });
    }
  }

  async updateExpenseStatus(id: number, status: UpdateExpenseStatus, approvedBy: string): Promise<Expense> {
    const updateData: any = {
      status: status.status,
      approvedBy,
      approvedAt: new Date(),
      updatedAt: new Date(),
    };

    if (status.status === 'rejected' && status.rejectionReason) {
      updateData.rejectionReason = status.rejectionReason;
    }

    const [updatedExpense] = await db
      .update(expenses)
      .set(updateData)
      .where(eq(expenses.id, id))
      .returning();
    return updatedExpense;
  }

  // Cash top-up operations
  async getCashTopUps(): Promise<CashTopUp[]> {
    return await db.select().from(cashTopUps).orderBy(desc(cashTopUps.createdAt));
  }

  async createCashTopUp(topUp: InsertCashTopUp): Promise<CashTopUp> {
    const [newTopUp] = await db
      .insert(cashTopUps)
      .values(topUp)
      .returning();
    return newTopUp;
  }

  async resetAllWorkerCashTopUps(): Promise<void> {
    // Reset all user balances to zero for staff and managers (not admins)
    const staffAndManagers = await db
      .select()
      .from(users)
      .where(sql`${users.role} IN ('staff', 'manager')`);

    for (const user of staffAndManagers) {
      await db
        .update(userBalances)
        .set({
          totalAllocated: "0",
          currentBalance: "0",
          updatedAt: new Date()
        })
        .where(eq(userBalances.userId, user.id));
    }
  }

  async getCashTopUpHistory(): Promise<Array<{
    id: number;
    amount: string;
    createdAt: Date;
    recipientName: string;
    addedByName: string;
  }>> {
    const topUps = await db
      .select({
        id: cashTopUps.id,
        amount: cashTopUps.amount,
        createdAt: cashTopUps.createdAt,
        recipientId: cashTopUps.userId,
        source: cashTopUps.source,
      })
      .from(cashTopUps)
      .orderBy(desc(cashTopUps.createdAt))
      .limit(50);

    // Get user details for each top-up
    const topUpsWithNames = await Promise.all(
      topUps.map(async (topUp) => {
        const [recipient] = await db
          .select({
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          })
          .from(users)
          .where(eq(users.id, topUp.recipientId));

        return {
          id: topUp.id,
          amount: topUp.amount,
          createdAt: topUp.createdAt!,
          recipientName: recipient 
            ? `${recipient.firstName || ''} ${recipient.lastName || ''}`.trim() || recipient.email || 'Unknown'
            : 'Unknown',
          addedByName: topUp.source || 'Admin',
        };
      })
    );

    return topUpsWithNames;
  }

  // User balance operations
  async getUserBalance(userId: string): Promise<UserBalance | undefined> {
    const [balance] = await db
      .select()
      .from(userBalances)
      .where(eq(userBalances.userId, userId));
    return balance;
  }

  async createUserBalance(balance: InsertUserBalance): Promise<UserBalance> {
    const [newBalance] = await db
      .insert(userBalances)
      .values(balance)
      .returning();
    return newBalance;
  }

  async updateUserBalance(userId: string, balance: Partial<UserBalance>): Promise<UserBalance> {
    const [updatedBalance] = await db
      .update(userBalances)
      .set({ ...balance, updatedAt: new Date() })
      .where(eq(userBalances.userId, userId))
      .returning();
    return updatedBalance;
  }

  async addCashToUser(userId: string, amount: number, giverId?: string, giverName?: string, date?: string): Promise<UserBalance> {
    // First, create a cash top-up record to track the transaction
    const topUpData: any = {
      userId,
      amount: amount.toString(),
      source: giverName || 'Admin',
      reference: `Cash transfer from ${giverName || 'Admin'}`,
      remarks: `Cash allocated by ${giverName || 'Admin'}`,
    };
    
    // If date is provided, add it to the top-up record
    if (date) {
      topUpData.date = new Date(date);
    }
    
    await this.createCashTopUp(topUpData);

    // Then, get or create user balance
    let userBalance = await this.getUserBalance(userId);
    
    if (!userBalance) {
      userBalance = await this.createUserBalance({
        userId,
        totalAllocated: amount.toString(),
        totalSpent: "0",
        pendingAmount: "0",
        currentBalance: amount.toString(),
      });
    } else {
      const newAllocated = parseFloat(userBalance.totalAllocated) + amount;
      const newBalance = parseFloat(userBalance.currentBalance) + amount;
      
      userBalance = await this.updateUserBalance(userId, {
        totalAllocated: newAllocated.toString(),
        currentBalance: newBalance.toString(),
      });
    }
    
    return userBalance;
  }

  // User-wise statistics for admin dashboard
  async getUserWiseStats(dateFilter?: {
    startDate?: string;
    endDate?: string;
  }): Promise<UserWithStats[]> {
    const staffUsers = await db.select().from(users).where(eq(users.role, 'staff'));
    
    const userStats = await Promise.all(
      staffUsers.map(async (user: any) => {
        const balance = await this.getUserBalance(user.id);
        const [pendingExpenses] = await db
          .select({ total: sum(sql`CAST(${expenses.amount} AS DECIMAL) + COALESCE(CAST(${expenses.gstAmount} AS DECIMAL), 0)`) })
          .from(expenses)
          .where(and(eq(expenses.userId, user.id), eq(expenses.status, 'pending')));
        
        return {
          ...user,
          totalExpenses: balance ? parseFloat(balance.totalSpent) : 0,
          approvedExpenses: balance ? parseFloat(balance.totalSpent) : 0,
          pendingExpenses: Number(pendingExpenses.total) || 0,
          rejectedExpenses: 0,
        };
      })
    );
    
    return userStats;
  }

  // Reports
  async getExpenseReport(filters?: {
    startDate?: string;
    endDate?: string;
    categoryId?: number;
    status?: string;
  }): Promise<ExpenseWithDetails[]> {
    return this.getExpenses(filters);
  }
}

export const storage = new DatabaseStorage();
