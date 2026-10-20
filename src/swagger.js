const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",

    info: {
      title: "REST API Service",
      version: "1.0.0",
      description:
        "REST API with Express, MongoDB, JWT authentication and role-based authorization"
    },

   servers: [
  {
    url: process.env.API_BASE_URL || "http://localhost:5000",
    description: process.env.API_BASE_URL
      ? "Deployed API server"
      : "Local development server"
  }
],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    }
  },

  apis: ["./src/routes/*.js"]
};

module.exports = swaggerJsdoc(options);