const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");

const {
  notFound,
  errorHandler
} = require("./middleware/errorMiddleware");

const app = express();

// 1. Security headers.
app.use(helmet());

// 2. CORS configuration.
const allowedOrigins = (
  process.env.CORS_ORIGINS ||
  "http://localhost:3000,http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim());

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    }
  })
);

// 3. Parse JSON request bodies.
app.use(express.json({ limit: "10kb" }));

// 4. Homepage route. This fixes GET /.
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to REST API Service!",
    version: "1.0.0",
    endpoints: {
      home: "/",
      health: "/api/health",
      register: "/api/auth/register",
      login: "/api/auth/login",
      profile: "/api/users/profile",
      users: "/api/users",
      documentation: "/api-docs"
    }
  });
});

// 5. API health check.
app.get("/api/health", (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;

  res.status(databaseConnected ? 200 : 503).json({
    success: databaseConnected,
    message: databaseConnected
      ? "REST API is running"
      : "Database connection unavailable",
    database: databaseConnected ? "connected" : "disconnected",
    environment: process.env.NODE_ENV || "development"
  });
});

// 6. Rate limit authentication requests.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Try again later."
  }
});

// 7. API routes.
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", userRoutes);

// 8. Swagger documentation.
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

// 9. Handle undefined routes.
app.use(notFound);

// 10. Centralized error handler.
app.use(errorHandler);

module.exports = app;