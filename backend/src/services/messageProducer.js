const { producer, isKafkaConnected } = require('../config/kafka');

const TOPIC_CHAT_MESSAGES = 'chat-messages';

/**
 * Publish a message to Kafka
 * @param {Object} messageData - Message data to publish
 * @returns {Promise<boolean>} - Success status
 */
async function publishMessage(messageData) {
    if (!isKafkaConnected()) {
        console.error('Kafka not connected');
        return false;
    }

    try {
        const message = {
            key: messageData.channelId,
            value: JSON.stringify(messageData),
            headers: {
                'event-type': 'message.created',
                'timestamp': Date.now().toString(),
            }
        };

        await producer.send({
            topic: TOPIC_CHAT_MESSAGES,
            messages: [message],
            compression: 1,
        });

        return true;
    } catch (error) {
        console.error('Failed to publish to Kafka:', error.message);
        return false;
    }
}

/**
 * Publish multiple messages in batch
 * @param {Array} messagesData - Array of message data
 * @returns {Promise<boolean>}
 */
async function publishMessageBatch(messagesData) {
    if (!isKafkaConnected()) {
        return false;
    }

    try {
        const messages = messagesData.map(msg => ({
            key: msg.channelId,
            value: JSON.stringify(msg),
            headers: {
                'event-type': 'message.created',
                'timestamp': Date.now().toString(),
            }
        }));

        await producer.send({
            topic: TOPIC_CHAT_MESSAGES,
            messages,
            compression: 1,
        });

        console.log(`Published ${messages.length} messages to Kafka`);
        return true;
    } catch (error) {
        console.error('Failed to publish batch to Kafka:', error.message);
        return false;
    }
}

module.exports = {
    publishMessage,
    publishMessageBatch,
    TOPIC_CHAT_MESSAGES,
};
