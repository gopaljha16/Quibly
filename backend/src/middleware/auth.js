const jwt = require("jsonwebtoken");
const User = require("../models/user");
const redisWrapper = require("../config/redis");

const authenticateToken = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ success: false, message: "Access token required" });
        }

        // Check if token is blacklisted in Redis
        const isBlacklisted = await redisWrapper.get(`token:${token}`);
        if (isBlacklisted) {
            return res.status(401).json({ success: false, message: "Token has been invalidated" });
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const user = await User.findById(decoded._id).select('-password');
        if (!user) {
            return res.status(401).json({ success: false, message: "User not found" });
        }

        // Check if user is banned
        if (user.isBanned) {
            return res.status(403).json({ success: false, message: "User account is banned" });
        }

        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: "Invalid token" });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: "Token expired" });
        }
        res.status(500).json({ success: false, message: "Authentication error" });
    }
};

const optionalAuth = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            req.user = null;
            return next();
        }

        // Check if token is blacklisted in Redis
        const isBlacklisted = await redisWrapper.get(`token:${token}`);
        if (isBlacklisted) {
            req.user = null;
            return next();
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const user = await User.findById(decoded._id).select('-password');
        if (user && !user.isBanned) {
            req.user = user;
            req.token = token;
        } else {
            req.user = null;
        }
        
        next();
    } catch (error) {
        req.user = null;
        next();
    }
};

module.exports = {
    authenticateToken,
    optionalAuth
};