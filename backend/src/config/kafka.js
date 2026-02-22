require("dotenv").config();
const { Kafka, logLevel } = require("kafkajs");
const fs = require("fs");

let kafka = null;
let producer = null;
let isConnected = false;

if (process.env.KAFKA_BROKERS || process.env.KAFKA_BROKER) {
    const brokersStr = process.env.KAFKA_BROKERS || process.env.KAFKA_BROKER;
    const brokers = brokersStr.split(",").map(b => b.trim());
    const useAuth = process.env.KAFKA_USERNAME && process.env.KAFKA_PASSWORD;
    const useSsl = process.env.KAFKA_SSL === "true" || process.env.KAFKA_CA_CERT_BASE64;

    console.log("Kafka Configuration:");
    console.log("  Brokers:", brokers);
    console.log("  Auth:", useAuth ? "SASL" : (useSsl ? "SSL/mTLS (Aiven)" : "None"));

    const kafkaConfig = {
        clientId: "discord-chat-app",
        brokers,
        logLevel: logLevel.ERROR,
        connectionTimeout: 30000,
        requestTimeout: 30000,
        retry: {
            retries: 5,
        },
    };

    if (useAuth || useSsl) {
        // Aiven Kafka SSL configuration
        const sslConfig = {
            rejectUnauthorized: true,
        };

        // Try to load certificates from environment variables (Base64 encoded)
        const hasCertsInEnv = process.env.KAFKA_CA_CERT_BASE64 &&
            process.env.KAFKA_CLIENT_CERT_BASE64 &&
            process.env.KAFKA_CLIENT_KEY_BASE64;

        // Certificate file paths (fallback)
        const certPath = "./src/config/service.cert";
        const keyPath = "./src/config/service.key";
        const caPath = "./src/config/ca.pem";

        const hasClientCertsFiles = fs.existsSync(certPath) && fs.existsSync(keyPath);
        const hasCaCertFile = fs.existsSync(caPath);

        // PRIORITY 1: Load from environment variables (Base64 encoded)
        if (hasCertsInEnv) {
            console.log("  Loading certificates from environment variables (Base64)");
            try {
                // Decode Base64 to original certificate format
                sslConfig.ca = [Buffer.from(process.env.KAFKA_CA_CERT_BASE64, 'base64').toString('utf-8')];
                sslConfig.cert = Buffer.from(process.env.KAFKA_CLIENT_CERT_BASE64, 'base64').toString('utf-8');
                sslConfig.key = Buffer.from(process.env.KAFKA_CLIENT_KEY_BASE64, 'base64').toString('utf-8');
                console.log("  Using certificate-based authentication (from env)");
                kafkaConfig.ssl = sslConfig;
            } catch (error) {
                console.error("  ❌ Failed to decode Base64 certificates:", error.message);
                console.log("  Falling back to file-based certificates");
                // Fall through to file-based loading
            }
        }
        // PRIORITY 2: Load from files (fallback for development)
        else if (hasCaCertFile || hasClientCertsFiles) {
            console.log("  Loading certificates from files (fallback mode)");

            // Load CA certificate from file
            if (hasCaCertFile) {
                try {
                    sslConfig.ca = [fs.readFileSync(caPath, "utf-8")];
                    console.log("  CA certificate loaded from file");
                } catch (error) {
                    console.warn("  ⚠️  Could not load CA certificate:", error.message);
                }
            }

            // Load client certificates for mTLS
            if (hasClientCertsFiles) {
                try {
                    sslConfig.cert = fs.readFileSync(certPath, "utf-8");
                    sslConfig.key = fs.readFileSync(keyPath, "utf-8");
                    console.log("  Client certificates loaded from files (mTLS mode)");
                    console.log("  Using certificate-based authentication");
                    kafkaConfig.ssl = sslConfig;
                } catch (error) {
                    console.warn("  ⚠️  Could not load client certificates:", error.message);
                    console.error(error);
                }
            } else {
                // Method 2: SASL authentication (username/password)
                console.log("  Using SASL authentication");
                kafkaConfig.ssl = sslConfig;

                const saslMechanism = process.env.KAFKA_SASL_MECHANISM || "scram-sha-256";

                kafkaConfig.sasl = {
                    mechanism: saslMechanism,
                    username: process.env.KAFKA_USERNAME,
                    password: process.env.KAFKA_PASSWORD,
                };

                console.log("  Username:", process.env.KAFKA_USERNAME);
                console.log("  Password length:", process.env.KAFKA_PASSWORD?.length);
                console.log("  SASL mechanism:", saslMechanism);
            }
        }
        // PRIORITY 3: SASL only (no certificates)
        else {
            console.log("  Using SASL authentication (no certificates found)");
            kafkaConfig.ssl = sslConfig;

            const saslMechanism = process.env.KAFKA_SASL_MECHANISM || "scram-sha-256";

            kafkaConfig.sasl = {
                mechanism: saslMechanism,
                username: process.env.KAFKA_USERNAME,
                password: process.env.KAFKA_PASSWORD,
            };

            console.log("  Username:", process.env.KAFKA_USERNAME);
            console.log("  Password length:", process.env.KAFKA_PASSWORD?.length);
            console.log("  SASL mechanism:", saslMechanism);
        }
    }

    kafka = new Kafka(kafkaConfig);

    producer = kafka.producer({
        allowAutoTopicCreation: !(useAuth || useSsl), // Allow auto-creation for local, disable for Aiven
        idempotent: true, // Ensure exactly-once delivery
        maxInFlightRequests: 5,
        transactionalId: undefined,
    });

    const connectProducer = async () => {
        try {
            // For local Kafka, wait a bit for it to be ready
            if (!(useAuth || useSsl)) {
                console.log("⏳ Waiting for Kafka to be ready...");
                await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
            }

            console.log("Connecting to Kafka...");
            await producer.connect();
            isConnected = true;
            console.log("Connected to Kafka successfully");

            // Notify that Kafka is ready
            if (global.onKafkaConnected) {
                console.log("Triggering Kafka connected callback...");
                global.onKafkaConnected();
            }
        } catch (error) {
            console.error("❌ Kafka connection failed:", error.message);
            console.error("   Error type:", error.type);
            console.error("   Full error:", error);
            console.log("App will continue without Kafka (direct DB writes)");
            isConnected = false;
        }
    };

    connectProducer();

    process.on("SIGTERM", async () => {
        if (producer && isConnected) {
            await producer.disconnect();
        }
    });
} else {
    console.log("KAFKA_BROKERS or KAFKA_BROKER not set, running without Kafka");
}

module.exports = {
    kafka,
    producer,
    isKafkaConnected: () => isConnected,
    disconnectKafka: async () => {
        if (producer && isConnected) {
            await producer.disconnect();
            isConnected = false;
            console.log('Kafka producer disconnected');
        }
    }
};
