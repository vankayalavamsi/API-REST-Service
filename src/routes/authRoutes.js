const express = require("express");

const {
  registerUser,
  loginUser
} = require("../controllers/authController");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: User registration and login
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Demo User
 *               email:
 *                 type: string
 *                 example: demo@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: ExamplePassword123!
 *     responses:
 *       201:
 *         description: Registration successful
 *       400:
 *         description: Invalid request
 *       409:
 *         description: Email already exists
 */
router.post("/register", registerUser);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: demo@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: ExamplePassword123!
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", loginUser);

module.exports = router;