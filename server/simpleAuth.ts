import { Express } from "express";
import session from "express-session";
import { storage } from "./storage";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export function setupSimpleAuth(app: Express) {
  const sessionStore = new MemoryStore({
    checkPeriod: 86400000, // prune expired entries every 24h
  });

  app.use(session({
    secret: process.env.SESSION_SECRET || 'demo-secret-key',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Login route
  app.post('/api/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // For demo purposes, accept password "fix098765" for all users
      if (password !== "fix098765") {
        return res.status(401).json({ message: "Invalid password" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Store user in session
      (req.session as any).user = user;
      res.json(user);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout route
  app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user
  app.get('/api/auth/user', (req, res) => {
    const user = (req.session as any)?.user;
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(user);
  });
}

// Simple auth middleware
export function isAuthenticated(req: any, res: any, next: any) {
  const user = (req.session as any)?.user;
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  req.user = { 
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    claims: { sub: user.id }
  };
  next();
}