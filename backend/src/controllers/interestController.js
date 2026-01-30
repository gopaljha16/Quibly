const db = require('../config/db');

// Get all available interests
exports.getAllInterests = async (req, res) => {
    try {
        const interests = await db.interest.findMany({
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true
            }
        });

        res.status(200).json({
            success: true,
            interests
        });
    } catch (error) {
        console.error('Get interests error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching interests'
        });
    }
};

// Create new interest (admin only - optional for now)
exports.createInterest = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || typeof name !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Interest name is required'
            });
        }

        const normalizedName = name.toLowerCase().trim();

        // Check if already exists
        const existing = await db.interest.findUnique({
            where: { name: normalizedName }
        });

        if (existing) {
            return res.status(409).json({
                success: false,
                message: 'Interest already exists'
            });
        }

        const interest = await db.interest.create({
            data: { name: normalizedName }
        });

        res.status(201).json({
            success: true,
            message: 'Interest created successfully',
            interest
        });
    } catch (error) {
        console.error('Create interest error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating interest'
        });
    }
};
