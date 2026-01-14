
const express = require('express');
const MessageRouter = express.Router();
const {createMessage } = require("../controller/message")

MessageRouter.post("/message" , createMessage)
