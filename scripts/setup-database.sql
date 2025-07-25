-- Fixinguru Petty Cash Management System Database Setup
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create sessions table for authentication
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR NOT NULL PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL
);

CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions (expire);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY NOT NULL,
  email VARCHAR UNIQUE,
  first_name VARCHAR,
  last_name VARCHAR,
  profile_image_url VARCHAR,
  password VARCHAR,
  role VARCHAR NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff')),
  department VARCHAR,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  category_id INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  remarks TEXT,
  receipt_url VARCHAR,
  expense_date TIMESTAMP NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by VARCHAR,
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  has_gst BOOLEAN DEFAULT false,
  gst_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- Create user_balances table
CREATE TABLE IF NOT EXISTS user_balances (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  total_allocated DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_spent DECIMAL(10,2) NOT NULL DEFAULT 0,
  pending_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  current_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create cash_top_ups table
CREATE TABLE IF NOT EXISTS cash_top_ups (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  source VARCHAR NOT NULL,
  reference VARCHAR,
  remarks TEXT,
  date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Insert default categories
INSERT INTO categories (name, description) VALUES
('Materials', 'Construction and repair materials'),
('Petrol', 'Fuel and transportation costs'),
('Parking', 'Parking fees and related charges'),
('Cash Card', 'ERP and cash card top-ups'),
('Cleaning Items', 'Cleaning supplies and equipment'),
('Disposal Fee', 'Waste disposal and removal fees'),
('Food', 'Meals and refreshments'),
('Others', 'Miscellaneous expenses')
ON CONFLICT (name) DO NOTHING;

-- Insert demo users (all with password "fix098765")
INSERT INTO users (id, email, first_name, last_name, role, department, is_active) VALUES
('admin-001', 'admin@fixinguru.sg', 'System', 'Administrator', 'admin', 'Management', true),
('manager-001', 'manager@fixinguru.sg', 'Project', 'Manager', 'manager', 'Operations', true),
('staff-001', 'staff1@fixinguru.sg', 'John', 'Worker', 'staff', 'Field Operations', true),
('staff-002', 'staff2@fixinguru.sg', 'Mary', 'Technician', 'staff', 'Technical', true),
('staff-003', 'staff3@fixinguru.sg', 'David', 'Assistant', 'staff', 'Field Operations', true),
('staff-004', 'staff4@fixinguru.sg', 'Sarah', 'Specialist', 'staff', 'Technical', true),
('admin-002', 'mrmanivasagam@gmail.com', 'Manivasagam', 'Admin', 'admin', 'Management', true)
ON CONFLICT (id) DO NOTHING;

-- Initialize user balances
INSERT INTO user_balances (user_id, total_allocated, total_spent, pending_amount, current_balance) 
SELECT id, 0, 0, 0, 0 FROM users 
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_cash_top_ups_user_id ON cash_top_ups(user_id);
CREATE INDEX IF NOT EXISTS idx_user_balances_user_id ON user_balances(user_id);

-- Grant permissions (if needed)
-- ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_balances ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE cash_top_ups ENABLE ROW LEVEL SECURITY;