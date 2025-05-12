import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./new-storage";
import { AuthUser } from "@shared/new-schema";

declare global {
  namespace Express {
    interface User extends AuthUser {
      profileId?: number;
    }
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'vega-show-secret',
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } 
        
        // Update last login time
        await storage.updateUser(user.id, { 
          lastLogin: new Date() 
        });
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUserByUsername((await storage.getUser(id))?.username || '');
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Handle user registration
  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).send("Username already exists");
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      // Create activity for registration
      await storage.createActivity({
        userId: user.id,
        activityType: 'registration',
        description: `New ${user.role} user registered`,
        entityId: user.id,
        entityType: 'user'
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      next(error);
    }
  });

  // Handle user login
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", async (err: Error, user: Express.User) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Invalid credentials" });
      
      // Check if user is active
      if (user.status !== 'active') {
        return res.status(403).json({ 
          message: `Your account is ${user.status}. Please contact support for assistance.` 
        });
      }

      req.login(user, (err) => {
        if (err) return next(err);
        
        // Create activity for login
        storage.createActivity({
          userId: user.id,
          activityType: 'login',
          description: `${user.role} user logged in`,
          entityId: user.id,
          entityType: 'user'
        });
        
        res.status(200).json(user);
      });
    })(req, res, next);
  });

  // Handle user logout
  app.post("/api/logout", (req, res, next) => {
    if (req.isAuthenticated()) {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      
      req.logout((err) => {
        if (err) return next(err);
        
        // Create activity for logout
        if (userId) {
          storage.createActivity({
            userId,
            activityType: 'logout',
            description: `${userRole} user logged out`,
            entityId: userId,
            entityType: 'user'
          });
        }
        
        res.sendStatus(200);
      });
    } else {
      res.sendStatus(200);
    }
  });

  // Get current user
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}