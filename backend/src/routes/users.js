const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Admin routes (TODO: Add admin authentication middleware)
router.get('/count', userController.activeUsers);
router.get('/', userController.getAllUsers);
router.get('/stats', userController.getPlatformStats);

module.exports = router;
