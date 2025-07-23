import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupSimpleAuth, isAuthenticated } from "./simpleAuth";
import { 
  insertExpenseSchema, 
  insertCashTopUpSchema, 
  insertCategorySchema,
  updateExpenseStatusSchema,
  insertUserBalanceSchema
} from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Setup multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for PDFs
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and PDF files are allowed.'));
    }
  }
});

function requireRole(roles: string[]) {
  return async (req: any, res: any, next: any) => {
    try {
      const user = (req.session as any)?.user;
      if (!user || !roles.includes(user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      
      // Add user to request for future use
      req.userData = user;
      next();
    } catch (error) {
      console.error("Error checking user role:", error);
      return res.status(403).json({ message: "Insufficient permissions" });
    }
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupSimpleAuth(app);

  // Serve uploaded files
  app.use('/uploads', express.static(uploadDir));

  // Note: Auth routes are now handled in simpleAuth.ts

  // Dashboard routes
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const { startDate, endDate } = req.query;
      
      const stats = await storage.getDashboardStats(userId, userRole, {
        startDate: startDate as string,
        endDate: endDate as string
      });
      
      // For admin/manager, also provide user-wise breakdown
      if (req.user.role === 'admin' || req.user.role === 'manager') {
        const userStats = await storage.getUserWiseStats({
          startDate: startDate as string,
          endDate: endDate as string
        });
        res.json({ ...stats, userBreakdown: userStats });
      } else {
        res.json(stats);
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Category routes
  app.get('/api/categories', isAuthenticated, async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post('/api/categories', isAuthenticated, requireRole(['admin']), async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // Expense routes
  app.get('/api/expenses', isAuthenticated, async (req: any, res) => {
    try {
      const filters: any = {};
      
      // Add date filtering if provided
      if (req.query.startDate) {
        filters.startDate = req.query.startDate as string;
      }
      if (req.query.endDate) {
        filters.endDate = req.query.endDate as string;
      }
      
      // Staff can only see their own expenses
      if (req.user.role === 'staff') {
        filters.userId = req.user.id;
      } else if (req.query.userId && req.query.userId !== 'all') {
        // Admin/Manager can filter by specific user
        filters.userId = req.query.userId;
      }
      
      // Apply query filters
      if (req.query.categoryId) filters.categoryId = parseInt(req.query.categoryId as string);
      if (req.query.status) filters.status = req.query.status as string;
      if (req.query.startDate) filters.startDate = req.query.startDate as string;
      if (req.query.endDate) filters.endDate = req.query.endDate as string;
      if (req.query.search) filters.search = req.query.search as string;
      
      const expenses = await storage.getExpenses(filters);
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.get('/api/expenses/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const expense = await storage.getExpenseById(id);
      
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      
      // Staff can only view their own expenses
      if (req.user.role === 'staff' && expense.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(expense);
    } catch (error) {
      console.error("Error fetching expense:", error);
      res.status(500).json({ message: "Failed to fetch expense" });
    }
  });

  app.post('/api/expenses', isAuthenticated, upload.single('receipt'), async (req: any, res) => {
    try {
      const hasGst = req.body.hasGst === 'true';
      const amount = parseFloat(req.body.amount);
      const gstAmount = hasGst ? (amount * 0.09) : 0;
      
      const expenseData = insertExpenseSchema.parse({
        ...req.body,
        userId: req.user.id,
        amount: amount.toString(),
        categoryId: parseInt(req.body.categoryId),
        expenseDate: new Date(req.body.expenseDate),
        hasGst: hasGst,
        gstAmount: gstAmount.toString()
      });
      
      // Handle file upload
      if (req.file) {
        const fileExtension = path.extname(req.file.originalname);
        const fileName = `${Date.now()}-${req.file.originalname}`;
        const filePath = path.join(uploadDir, fileName);
        
        fs.renameSync(req.file.path, filePath);
        expenseData.receiptUrl = `/uploads/${fileName}`;
      }
      
      const expense = await storage.createExpense(expenseData);
      res.json(expense);
    } catch (error) {
      console.error("Error creating expense:", error);
      res.status(500).json({ message: "Failed to create expense" });
    }
  });

  app.put('/api/expenses/:id/status', isAuthenticated, requireRole(['manager', 'admin']), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const statusData = updateExpenseStatusSchema.parse(req.body);
      const approvedBy = req.user.id;
      
      const expense = await storage.updateExpenseStatus(id, statusData, approvedBy);
      res.json(expense);
    } catch (error) {
      console.error("Error updating expense status:", error);
      res.status(500).json({ message: "Failed to update expense status" });
    }
  });

  // Cash top-up routes
  app.get('/api/cash-topups', isAuthenticated, requireRole(['admin']), async (req, res) => {
    try {
      const topUps = await storage.getCashTopUps();
      res.json(topUps);
    } catch (error) {
      console.error("Error fetching cash top-ups:", error);
      res.status(500).json({ message: "Failed to fetch cash top-ups" });
    }
  });

  app.post('/api/cash-topups', isAuthenticated, requireRole(['admin']), async (req: any, res) => {
    try {
      const topUpData = insertCashTopUpSchema.parse({
        ...req.body,
        userId: req.user.id,
        amount: parseFloat(req.body.amount)
      });
      
      const topUp = await storage.createCashTopUp(topUpData);
      res.json(topUp);
    } catch (error) {
      console.error("Error creating cash top-up:", error);
      res.status(500).json({ message: "Failed to create cash top-up" });
    }
  });

  // Cash top-up history endpoint
  app.get('/api/cash-topups-history', isAuthenticated, requireRole(['admin', 'manager']), async (req, res) => {
    try {
      const topUpHistory = await storage.getCashTopUpHistory();
      res.json(topUpHistory);
    } catch (error) {
      console.error("Error fetching cash top-up history:", error);
      res.status(500).json({ message: "Failed to fetch cash top-up history" });
    }
  });

  // Reset all worker cash top-ups to zero
  app.post('/api/reset-cash-topups', isAuthenticated, requireRole(['admin']), async (req, res) => {
    try {
      await storage.resetAllWorkerCashTopUps();
      res.json({ message: "All worker cash top-ups have been reset to zero" });
    } catch (error) {
      console.error("Error resetting cash top-ups:", error);
      res.status(500).json({ message: "Failed to reset cash top-ups" });
    }
  });

  // User management routes
  app.get('/api/users', isAuthenticated, requireRole(['admin']), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/users', isAuthenticated, requireRole(['admin']), async (req, res) => {
    try {
      const userData = {
        id: `user_${req.body.firstName.toLowerCase()}_${req.body.lastName.toLowerCase()}_new`,
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        role: req.body.role || 'staff',
        department: req.body.department || '',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put('/api/users/:id/role', isAuthenticated, requireRole(['admin']), async (req, res) => {
    try {
      const id = req.params.id;
      const { role } = req.body;
      
      if (!['admin', 'manager', 'staff'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      const user = await storage.updateUserRole(id, role);
      res.json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.put('/api/users/:id/toggle-status', isAuthenticated, requireRole(['admin']), async (req, res) => {
    try {
      const id = req.params.id;
      const user = await storage.toggleUserStatus(id);
      res.json(user);
    } catch (error) {
      console.error("Error toggling user status:", error);
      res.status(500).json({ message: "Failed to toggle user status" });
    }
  });

  // Reports routes
  app.get('/api/reports/expenses', isAuthenticated, requireRole(['manager', 'admin']), async (req, res) => {
    try {
      const filters: any = {};
      
      if (req.query.startDate) filters.startDate = req.query.startDate as string;
      if (req.query.endDate) filters.endDate = req.query.endDate as string;
      if (req.query.categoryId) filters.categoryId = parseInt(req.query.categoryId as string);
      if (req.query.status) filters.status = req.query.status as string;
      
      const expenses = await storage.getExpenseReport(filters);
      res.json(expenses);
    } catch (error) {
      console.error("Error generating expense report:", error);
      res.status(500).json({ message: "Failed to generate expense report" });
    }
  });

  app.get('/api/reports/expenses/csv', isAuthenticated, requireRole(['manager', 'admin']), async (req, res) => {
    try {
      const filters: any = {};
      
      if (req.query.startDate) filters.startDate = req.query.startDate as string;
      if (req.query.endDate) filters.endDate = req.query.endDate as string;
      if (req.query.categoryId) filters.categoryId = parseInt(req.query.categoryId as string);
      if (req.query.status) filters.status = req.query.status as string;
      
      const expenses = await storage.getExpenseReport(filters);
      
      // Convert to CSV format
      const csvHeaders = ['Date', 'Employee', 'Category', 'Description', 'Amount', 'Status', 'Approved By', 'Approved Date'];
      const csvRows = expenses.map(expense => [
        expense.expenseDate.toISOString().split('T')[0],
        `${expense.user.firstName} ${expense.user.lastName}`,
        expense.category.name,
        expense.description,
        expense.amount,
        expense.status,
        expense.approver ? `${expense.approver.firstName} ${expense.approver.lastName}` : '',
        expense.approvedAt ? expense.approvedAt.toISOString().split('T')[0] : ''
      ]);
      
      const csvContent = [csvHeaders, ...csvRows].map(row => row.join(',')).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="expenses-report.csv"');
      res.send(csvContent);
    } catch (error) {
      console.error("Error generating CSV report:", error);
      res.status(500).json({ message: "Failed to generate CSV report" });
    }
  });

  // User balance endpoints
  app.get('/api/user-balance/:userId', isAuthenticated, requireRole(['admin', 'manager']), async (req, res) => {
    try {
      const { userId } = req.params;
      const balance = await storage.getUserBalance(userId);
      res.json(balance);
    } catch (error) {
      console.error("Error fetching user balance:", error);
      res.status(500).json({ message: "Failed to fetch user balance" });
    }
  });

  app.post('/api/add-cash', isAuthenticated, requireRole(['admin', 'manager']), async (req, res) => {
    try {
      const { userId, amount, date } = req.body;
      const giverId = (req.user as any).id;
      const giverName = (req.user as any).firstName ? `${(req.user as any).firstName} ${(req.user as any).lastName || ''}`.trim() : (req.user as any).email;
      
      const balance = await storage.addCashToUser(userId, parseFloat(amount), giverId, giverName, date);
      res.json(balance);
    } catch (error) {
      console.error("Error adding cash to user:", error);
      res.status(500).json({ message: "Failed to add cash to user" });
    }
  });

  // Transactions endpoint - shows cash top-ups (cash received by workers)
  app.get('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const cashTopUps = await storage.getCashTopUpHistory();
      
      // Staff can only see their own cash received transactions
      if (req.user.role === 'staff') {
        const userName = req.user.firstName ? `${req.user.firstName} ${req.user.lastName || ''}`.trim() : req.user.email;
        const filteredTopUps = cashTopUps.filter(topUp => 
          topUp.recipientName.toLowerCase().includes(userName.toLowerCase()) ||
          topUp.recipientName.toLowerCase().includes(req.user.email.toLowerCase())
        );
        res.json(filteredTopUps);
      } else {
        // Admin/Manager can see all cash transactions
        res.json(cashTopUps);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
