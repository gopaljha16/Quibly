const router = require('express').Router();
const interestController = require('../controllers/interestController');
const { authenticate } = require('../middleware/auth');

// Get all interests (public)
router.get('/', interestController.getAllInterests);

// Create interest (authenticated - could add admin check later)
router.post('/', authenticate, interestController.createInterest);

module.exports = router;
