const Message = require("../models/message")

const createMessage = async (req, res) => {
    try {
        const { channelId, content } = req.body
        const message = await Message.create({
            channelId,
            senderId: req.user.id,
            content,
        });

        res.status(201).json(message);
    } catch (err) {
        res.status(401).json({
            message:err.message
        })
    }
}

const getMessages = async (req, res) => {
  const { channelId } = req.params;
  const { cursor } = req.query;

  const query = { channelId };

  if (cursor) {
    query.createdAt = { $lt: new Date(cursor) };
  }

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("senderId", "username avatar");

  res.json(messages);
};

const editMessage = async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  const message = await Message.findOneAndUpdate(
    { _id: id, senderId: req.user.id },
    { content, editedAt: new Date() },
    { new: true }
  );

  res.json(message);
};

const deleteMessage = async (req, res) => {
  const { id } = req.params;

  await Message.findByIdAndUpdate(id, {
    isDeleted: true,
    content: "This message was deleted",
  });

  res.sendStatus(204);
};


module.exports = {createMessage , getMessages , editMessage , deleteMessage  }

