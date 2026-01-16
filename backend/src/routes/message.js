const express = require('express');
const MessageRouter = express.Router();
const {createMessage , getMessages , editMessage , deleteMessage } = require("../controller/message")
const { authenticateToken } = require('../middleware/auth');

MessageRouter.post("/" , authenticateToken , createMessage)
MessageRouter.get("/:channelId" , authenticateToken , getMessages)
MessageRouter.put("/:id" , authenticateToken , editMessage)
MessageRouter.delete("/:id" , authenticateToken , deleteMessage)

module.exports = MessageRouter