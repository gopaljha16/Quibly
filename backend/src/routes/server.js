const express = require('express');
const router = express.Router();
const serverController = require('../controllers/serverController');
const channelController = require('../controllers/channelController');
const roleController = require('../controllers/roleController');
const auditLogController = require('../controllers/auditLogController');
const autoModController = require('../controllers/autoModController');
const welcomeScreenController = require('../controllers/welcomeScreenController');
const memberScreeningController = require('../controllers/memberScreeningController');
const serverTemplateController = require('../controllers/serverTemplateController');
const serverAnalyticsController = require('../controllers/serverAnalyticsController');
const { authenticate } = require('../middleware/auth');
const { uploadServerIcon } = require('../utils/cloudinary');

// All routes require authentication
router.use(authenticate);

// Server discovery route (must be before /:serverId to avoid conflicts)
router.get('/discover', serverController.discoverServers);

// Server templates routes
router.get('/templates', serverTemplateController.getTemplates);
router.get('/templates/:templateId', serverTemplateController.getTemplateById);
router.post('/templates/create-server', serverTemplateController.createServerFromTemplate);
router.post('/templates/seed', serverTemplateController.seedTemplates); // Admin only

// Vanity URL routes (must be before /:serverId)
router.get('/vanity/:vanityUrl/check', serverController.checkVanityUrl);
router.get('/vanity/:vanityUrl', serverController.getServerByVanityUrl);

// Server management routes
router.post('/create', serverController.createServer);
router.get('/getmy-servers', serverController.getMyServers);
router.get('/:serverId', serverController.getServerById);
router.put('/:serverId', serverController.updateServer);
router.delete('/:serverId', serverController.deleteServer);
router.post('/:serverId/leave', serverController.leaveServer);
router.get('/:serverId/members', serverController.getMembers);

// Server icon upload
router.post('/:serverId/icon', uploadServerIcon.single('file'), serverController.uploadServerIcon);

// Server interests routes
router.get('/:serverId/interests', serverController.getServerInterests);
router.post('/:serverId/interests', serverController.addServerInterests);
router.delete('/:serverId/interests/:interestId', serverController.removeServerInterest);

// Channel management routes
router.post('/:serverId/create-channel', channelController.createChannel);
router.get('/:serverId/get-channels', channelController.getChannels);
router.get('/channel/:channelId', channelController.getChannelById);
router.put('/channel/:channelId', channelController.updateChannel);
router.delete('/channel/:channelId', channelController.deleteChannel);
router.patch('/:serverId/reorder-channels', channelController.reorderChannels);
router.get('/recommended-channels', channelController.getRecommendedChannels);

// Role management routes
router.get('/:serverId/roles', roleController.getRoles);
router.post('/:serverId/roles', roleController.createRole);
router.patch('/:serverId/roles/:roleId', roleController.updateRole);
router.delete('/:serverId/roles/:roleId', roleController.deleteRole);
router.patch('/:serverId/members/:userId/roles', roleController.updateMemberRoles);
router.patch('/:serverId/members/:userId/timeout', serverController.timeoutMember);
router.patch('/:serverId/members/:userId/ban', serverController.banMember);
router.patch('/:serverId/members/:userId/unban', serverController.unbanMember);

// Banned words routes
router.get('/:serverId/banned-words', serverController.getBannedWords);
router.put('/:serverId/banned-words', serverController.updateBannedWords);

// Audit log routes
router.get('/:serverId/audit-logs', auditLogController.getAuditLogs);
router.get('/:serverId/audit-logs/stats', auditLogController.getAuditLogStats);

// Auto-moderation routes
router.get('/:serverId/auto-mod/rules', autoModController.getAutoModRules);
router.post('/:serverId/auto-mod/rules', autoModController.createAutoModRule);
router.patch('/:serverId/auto-mod/rules/:ruleId', autoModController.updateAutoModRule);
router.delete('/:serverId/auto-mod/rules/:ruleId', autoModController.deleteAutoModRule);

// Welcome screen routes
router.get('/:serverId/welcome-screen', welcomeScreenController.getWelcomeScreen);
router.put('/:serverId/welcome-screen', welcomeScreenController.updateWelcomeScreen);

// Member screening routes
router.get('/:serverId/member-screening', memberScreeningController.getMemberScreening);
router.put('/:serverId/member-screening', memberScreeningController.updateMemberScreening);
router.post('/:serverId/member-screening/submit', memberScreeningController.submitScreeningResponse);
router.get('/:serverId/member-screening/pending', memberScreeningController.getPendingScreeningResponses);
router.patch('/:serverId/member-screening/responses/:responseId', memberScreeningController.reviewScreeningResponse);

// Server rules routes
router.get('/:serverId/rules', serverController.getServerRules);
router.put('/:serverId/rules', serverController.updateServerRules);

// Vanity URL management
router.put('/:serverId/vanity-url', serverController.setVanityUrl);

// Server badges (admin/owner only)
router.patch('/:serverId/badges', serverController.updateServerBadges);

// Server analytics routes
router.get('/:serverId/analytics', serverAnalyticsController.getServerAnalytics);

module.exports = router;
