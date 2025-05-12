import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Determine the environment and load the appropriate .env file
const nodeEnv = process.env.NODE_ENV || 'development';
const envMap = {
  'development': '.dev.env',
  'production': '.prod.env',
};

const envFileName = envMap[nodeEnv] || '.local.env';
const envFilePath = path.join(process.cwd(), 'environments', envFileName);

// Check if env file exists and load it
if (fs.existsSync(envFilePath)) {
  console.log(`Loading environment from: ${envFilePath}`);
  dotenv.config({ path: envFilePath });
} else {
  console.warn(`Environment file ${envFilePath} not found. Using environment variables already set.`);
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Trust proxy for AWS Load Balancers
app.set('trust proxy', 1);

// CORS configuration with domain support
app.use((req, res, next) => {
  const allowedOrigins = ['https://vegashow.ai', 'https://www.vegashow.ai'];
  const origin = req.headers.origin;
  
  // In production, only allow specific domains; in dev, allow all
  if (process.env.NODE_ENV === 'production') {
    if (origin && allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
    }
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle OPTIONS method
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = process.env.PORT || 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`Server running on port ${port} in ${process.env.NODE_ENV || 'development'} mode`);
    if (process.env.NODE_ENV === 'production') {
      log(`Production URL: https://vegashow.ai`);
    } else {
      log(`Local URL: http://localhost:${port}`);
    }
  });
})();
