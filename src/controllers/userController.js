const mongoose = require("mongoose");
const User = require("../models/User");

// Return only public user information.
const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

// Get the logged-in user's profile.
const getProfile = async (req, res) => {
  res.status(200).json({
    success: true,
    user: publicUser(req.user)
  });
};

// Update the logged-in user's own profile.
const updateProfile = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const allowedFields = ["name", "email", "password"];

    const invalidFields = Object.keys(req.body).filter(
      (field) => !allowedFields.includes(field)
    );

    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Unsupported fields",
        fields: invalidFields
      });
    }

    if (name !== undefined) {
      if (
        typeof name !== "string" ||
        name.trim().length < 2 ||
        name.trim().length > 80
      ) {
        return res.status(400).json({
          success: false,
          message: "Name must contain 2 to 80 characters"
        });
      }

      req.user.name = name.trim();
    }

    if (email !== undefined) {
      if (
        typeof email !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      ) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid email"
        });
      }

      req.user.email = email.trim().toLowerCase();
    }

    if (password !== undefined) {
      if (
        typeof password !== "string" ||
        password.length < 8 ||
        password.length > 72
      ) {
        return res.status(400).json({
          success: false,
          message: "Password must contain 8 to 72 characters"
        });
      }

      req.user.password = password;
    }

    await req.user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: publicUser(req.user)
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email address is already in use"
      });
    }

    next(error);
  }
};

// Admin: retrieve all users.
const getAllUsers = async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    if (
      !Number.isInteger(page) ||
      !Number.isInteger(limit) ||
      page < 1 ||
      limit < 1 ||
      limit > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Page must be positive and limit must be between 1 and 100"
      });
    }

    const [users, total] = await Promise.all([
      User.find()
        .select("name email role createdAt updatedAt")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),

      User.countDocuments()
    ]);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      users: users.map(publicUser)
    });
  } catch (error) {
    next(error);
  }
};

// Admin: retrieve one user.
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      user: publicUser(user)
    });
  } catch (error) {
    next(error);
  }
};

// Admin: update a user's name, email, or role.
const updateUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    const allowedFields = ["name", "email", "role"];

    const invalidFields = Object.keys(req.body).filter(
      (field) => !allowedFields.includes(field)
    );

    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Unsupported fields",
        fields: invalidFields
      });
    }

    const updates = {};

    if (req.body.name !== undefined) {
      if (
        typeof req.body.name !== "string" ||
        req.body.name.trim().length < 2 ||
        req.body.name.trim().length > 80
      ) {
        return res.status(400).json({
          success: false,
          message: "Name must contain 2 to 80 characters"
        });
      }

      updates.name = req.body.name.trim();
    }

    if (req.body.email !== undefined) {
      if (
        typeof req.body.email !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          req.body.email.trim()
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid email"
        });
      }

      updates.email = req.body.email.trim().toLowerCase();
    }

    if (req.body.role !== undefined) {
      if (!["user", "admin"].includes(req.body.role)) {
        return res.status(400).json({
          success: false,
          message: "Role must be user or admin"
        });
      }

      // Prevent an administrator from removing their own
      // administrative access through this endpoint.
      if (
        id === req.user._id.toString() &&
        req.body.role !== "admin"
      ) {
        return res.status(400).json({
          success: false,
          message: "You cannot remove your own admin role"
        });
      }

      updates.role = req.body.role;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one valid field to update"
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      {
        new: true,
        runValidators: true
      }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: publicUser(user)
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email address is already in use"
      });
    }

    next(error);
  }
};

// Admin: delete a user.
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    if (id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account here"
      });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getAllUsers,
  getUserById,
  updateUserById,
  deleteUser
};