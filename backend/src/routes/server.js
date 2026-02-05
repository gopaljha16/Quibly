const express = require('express');
const router = express.Router();
const serverController = require('../controllers/serverController');
const channelController = require('../controllers/channelController');
const roleController = require('../controllers/roleController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Server management routes
router.post('/create', serverController.createServer);
router.get('/getmy-servers', serverController.getMyServers);
router.get('/:serverId', serverController.getServerById);
router.put('/:serverId', serverController.updateServer);
router.delete('/:serverId', serverController.deleteServer);
router.post('/:serverId/leave', serverController.leaveServer);
router.get('/:serverId/members', serverController.getMembers);

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

module.exports = router;
