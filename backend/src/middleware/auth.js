const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Authenticate user middleware
exports.authenticate = async (req, res, next) => {
    try {
        let token = null;

        // 1. Prioritize Authorization header (sent by our frontend API client)
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }

        // 2. Fall back to cookie if Authorization header is missing
        if (!token) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Not authorized"
            });
        }
        console.log("token :- ", token)

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from database
        const user = await db.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                username: true,
                discriminator: true,
                email: true,
                avatar: true,
                banner: true,
                bio: true,
                status: true,
                customStatus: true,
                isVerified: true,
                isBanned: true
            }
        });

        if (!user) {
            // Clear the invalid token with the same options used when setting it
            res.clearCookie('token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                path: '/'
            });
            return res.status(401).json({
                success: false,
                message: 'User not found. Please log in again.'
            });
        }

        if (user.isBanned) {
            return res.status(403).json({
                success: false,
                message: 'Account has been banned'
            });
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }

        console.error('Authentication error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during authentication'
        });
    }
};

// Optional auth - doesn't fail if no token
exports.optionalAuth = async (req, res, next) => {
    try {
        let token = null;

        // 1. Prioritize Authorization header
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }

        // 2. Fall back to cookie
        if (!token) {
            token = req.cookies.token;
        }

        if (!token) {
            req.user = null;
            return next();
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await db.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                username: true,
                discriminator: true,
                email: true,
                avatar: true,
                isVerified: true,
                isBanned: true
            }
        });

        req.user = user || null;
        next();
    } catch (error) {
        req.user = null;
        next();
    }
};
