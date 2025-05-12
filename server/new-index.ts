import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { fromZodError } from "zod-validation-error";
import { ZodError } from "zod";
import { setupVite, serveStatic, log } from "./vite.js";
import { registerRoutes } from "./new-routes.js";
import { testConnection } from "./new-db.js";

// Load environment variables
const envFile = process.env.NODE_ENV === "production" ? ".prod.env" : ".dev.env";
try {
  const envPath = path.resolve(process.cwd(), "environments", envFile);
  dotenv.config({ path: envPath });
  log(`Loading environment from: ${envPath}`);
} catch (error) {
  log(`Error loading .env file: ${error}`);
}

// Create Express application
const app = express();

// Trust proxy for secure cookies in production
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// Middleware for parsing request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Determine port based on environment
const port = process.env.PORT || 5000;

async function main() {
  let server;

  // Development mode with Vite
  if (process.env.NODE_ENV !== "production") {
    server = await registerRoutes(app);
    await setupVite(app, server);
  } else {
    // Production mode
    serveStatic(app);
    server = await registerRoutes(app);
  }

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ZodError) {
      const validationError = fromZodError(err);
      return res.status(400).json({ message: validationError.message });
    }
    
    log(`Error: ${err.message}`, "error");
    
    if (err.code === "P2002") {
      return res.status(400).json({ message: "A record with this information already exists." });
    }
    
    return res.status(500).json({
      message: process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
    });
  });

  // Start the server
  server.listen(port, "0.0.0.0", () => {
    log(`Server running on port ${port} in ${process.env.NODE_ENV || "development"} mode`);
    log(`Local URL: http://localhost:${port}`);
    
    // Test database connection
    testConnection();
  });
}

main().catch((error) => {
  log(`Failed to start server: ${error.message}`, "error");
});