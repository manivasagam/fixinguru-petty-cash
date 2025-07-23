import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  decimal,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  password: varchar("password"),
  role: varchar("role", { enum: ["admin", "manager", "staff"] }).notNull().default("staff"),
  department: varchar("department"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Expenses table
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  categoryId: integer("category_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  remarks: text("remarks"),
  receiptUrl: varchar("receipt_url"),
  expenseDate: timestamp("expense_date").notNull(),
  status: varchar("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  approvedBy: varchar("approved_by"),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  hasGst: boolean("has_gst").default(false),
  gstAmount: decimal("gst_amount", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User balance table for tracking cash allocations
export const userBalances = pgTable("user_balances", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  totalAllocated: decimal("total_allocated", { precision: 10, scale: 2 }).notNull().default("0"),
  totalSpent: decimal("total_spent", { precision: 10, scale: 2 }).notNull().default("0"),
  pendingAmount: decimal("pending_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  currentBalance: decimal("current_balance", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cash top-ups table
export const cashTopUps = pgTable("cash_top_ups", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  source: varchar("source").notNull(),
  reference: varchar("reference"),
  remarks: text("remarks"),
  date: timestamp("date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  expenses: many(expenses),
  cashTopUps: many(cashTopUps),
  approvedExpenses: many(expenses, { relationName: "approver" }),
  balance: one(userBalances),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  expenses: many(expenses),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  user: one(users, {
    fields: [expenses.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [expenses.categoryId],
    references: [categories.id],
  }),
  approver: one(users, {
    fields: [expenses.approvedBy],
    references: [users.id],
    relationName: "approver",
  }),
}));

export const cashTopUpsRelations = relations(cashTopUps, ({ one }) => ({
  user: one(users, {
    fields: [cashTopUps.userId],
    references: [users.id],
  }),
}));

export const userBalancesRelations = relations(userBalances, ({ one }) => ({
  user: one(users, {
    fields: [userBalances.userId],
    references: [users.id],
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvedBy: true,
  approvedAt: true,
});

export const insertCashTopUpSchema = createInsertSchema(cashTopUps).omit({
  id: true,
  createdAt: true,
});

export const insertUserBalanceSchema = createInsertSchema(userBalances).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateExpenseStatusSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  rejectionReason: z.string().optional(),
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type CashTopUp = typeof cashTopUps.$inferSelect;
export type InsertCashTopUp = z.infer<typeof insertCashTopUpSchema>;
export type UserBalance = typeof userBalances.$inferSelect;
export type InsertUserBalance = z.infer<typeof insertUserBalanceSchema>;
export type UpdateExpenseStatus = z.infer<typeof updateExpenseStatusSchema>;

// Extended types with relations
export type ExpenseWithDetails = Expense & {
  user: User;
  category: Category;
  approver?: User;
};

export type UserWithStats = User & {
  totalExpenses?: number;
  approvedExpenses?: number;
  pendingExpenses?: number;
  rejectedExpenses?: number;
};
