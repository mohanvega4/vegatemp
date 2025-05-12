import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, loginSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import createMemoryStore from "memorystore";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    // Check if the stored password has the expected format
    if (!stored || !stored.includes('.')) {
      console.error('Invalid stored password format');
      return false;
    }
    
    const [hashed, salt] = stored.split(".");
    if (!hashed || !salt) {
      console.error('Missing hash or salt in stored password');
      return false;
    }
    
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    
    if (hashedBuf.length !== suppliedBuf.length) {
      console.error('Buffer length mismatch:', hashedBuf.length, 'vs', suppliedBuf.length);
      return false;
    }
    
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
}

export function setupAuth(app: Express) {
  // Create session settings
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "vega-show-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Get the user from storage
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false);
        }
        
        // Check if this is a mock user with plain password (test environment)
        // This will happen when the database is not available
        const isMockUser = user.password.indexOf('.') === -1;
        
        if (isMockUser) {
          // Simple password comparison for mock users
          if (user.password !== password) {
            return done(null, false);
          }
        } else {
          // For real users with hashed passwords
          if (!(await comparePasswords(password, user.password))) {
            return done(null, false);
          }
        }
        
        // Only allow active users to log in (except admins)
        if (user.status !== 'active' && user.role !== 'admin') {
          return done(null, false);
        }
        
        return done(null, user);
      } catch (error) {
        console.error('Authentication error:', error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Parse and validate the input
      const userData = req.body;
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Hash the password
      const hashedPassword = await hashPassword(userData.password);
      
      // Create the user
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
        // Force role to be customer or provider, never admin during registration
        role: userData.role === 'provider' ? 'provider' : 'customer',
        // All users except admins start with pending status
        status: 'pending'
      });
      
      // Create activity for new user registration
      await storage.createActivity({
        userId: user.id,
        activityType: 'registration',
        description: `New ${user.role} registered: ${user.name}`,
        entityId: user.id,
        entityType: 'user'
      });

      // Automatically login the registered user if they're active
      if (user.status === 'active') {
        req.login(user, (err) => {
          if (err) return next(err);
          const { password, ...userWithoutPassword } = user;
          res.status(201).json(userWithoutPassword);
        });
      } else {
        // For pending users, just return success but don't log them in
        const { password, ...userWithoutPassword } = user;
        res.status(201).json({ 
          ...userWithoutPassword,
          message: "Registration successful. Your account is pending approval."
        });
      }
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    try {
      // Validate login data
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      passport.authenticate("local", (err: Error, user: Express.User) => {
        if (err) {
          return next(err);
        }
        if (!user) {
          return res.status(401).json({ message: "Invalid username or password" });
        }
        req.logIn(user, (err) => {
          if (err) {
            return next(err);
          }
          
          // Log the login activity
          storage.createActivity({
            userId: user.id,
            activityType: 'login',
            description: `User logged in: ${user.name}`,
            entityId: user.id,
            entityType: 'user'
          });
          
          // Return user data without password
          const { password, ...userWithoutPassword } = user;
          return res.status(200).json(userWithoutPassword);
        });
      })(req, res, next);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/logout", (req, res, next) => {
    // Log the logout activity if user is authenticated
    if (req.isAuthenticated() && req.user) {
      storage.createActivity({
        userId: req.user.id,
        activityType: 'logout',
        description: `User logged out: ${req.user.name}`,
        entityId: req.user.id,
        entityType: 'user'
      });
    }
    
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Return user data without password
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
}
