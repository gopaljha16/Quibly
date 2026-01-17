const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");

const { createServer, getMyServers, getServerById, deleteServer, leaveServer, getMembers, joinServer, updateServer } = require("../controller/server");
const { createChannel, getChannels, getChannelById, updateChannel, deleteChannel, reorderChannels } = require("../controller/channel");


//post routes
//server routes
router.post("/create", authenticateToken, createServer);
router.post("/:serverId/join", authenticateToken, joinServer);
router.post("/:serverId/leave", authenticateToken, leaveServer);

//put routes
//server routes
router.put("/:serverId", authenticateToken, updateServer);

//channel routes
router.post("/:serverId/create-channel", authenticateToken, createChannel );
router.patch("/:serverId/reorder-channels", authenticateToken, reorderChannels);
router.put("/channel/:channelId", authenticateToken, updateChannel);


//get routes
//server routes
router.get("/getmy-servers" , authenticateToken , getMyServers)
router.get("/:serverId" , authenticateToken , getServerById)
router.get("/:serverId/members" , authenticateToken , getMembers)

//channel routes
router.get("/:serverId/get-channels" , authenticateToken , getChannels)
router.get("/channel/:channelId" , authenticateToken , getChannelById)


//delete routes
//server routes
router.delete("/:serverId" , authenticateToken , deleteServer)
//channel routes
router.delete("/channel/:channelId" , authenticateToken , deleteChannel)


module.exports = router;
