const prisma = require("../config/db");

exports.toggleReaction = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { emoji } = req.body;
        const userId = req.user.id;

        if (!messageId || !emoji) {
            return res.status(400).json({ error: "Message ID and emoji are required" });
        }

        // Check if reaction already exists
        const existingReaction = await prisma.reaction.findUnique({
            where: {
                messageId_userId_emoji: {
                    messageId,
                    userId,
                    emoji,
                },
            },
        });

        if (existingReaction) {
            // Remove reaction
            await prisma.reaction.delete({
                where: {
                    id: existingReaction.id,
                },
            });

            // Emit socket event
            if (global.io) {
                global.io.emit("message:reaction:remove", {
                    messageId,
                    userId,
                    emoji,
                });
            }

            return res.status(200).json({ message: "Reaction removed" });
        } else {
            // Add reaction
            const reaction = await prisma.reaction.create({
                data: {
                    messageId,
                    userId,
                    emoji,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            discriminator: true,
                            avatar: true,
                        },
                    },
                },
            });

            // Emit socket event
            if (global.io) {
                global.io.emit("message:reaction:add", {
                    messageId,
                    reaction,
                });
            }

            return res.status(201).json(reaction);
        }
    } catch (error) {
        console.error("Error toggling reaction:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
