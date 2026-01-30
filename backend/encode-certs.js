/**
 * Encode Kafka certificates to Base64 for .env file
 * Run: node encode-certs.js
 */

const fs = require('fs');

console.log('📝 Encoding Kafka certificates to Base64...\n');

try {
    // Read certificate files
    const ca = fs.readFileSync('./src/config/ca.pem', 'utf-8');
    const cert = fs.readFileSync('./src/config/service.cert', 'utf-8');
    const key = fs.readFileSync('./src/config/service.key', 'utf-8');

    // Encode to Base64
    const caBase64 = Buffer.from(ca).toString('base64');
    const certBase64 = Buffer.from(cert).toString('base64');
    const keyBase64 = Buffer.from(key).toString('base64');

    console.log('✅ Certificates encoded successfully!\n');
    console.log('📋 Copy these lines to your .env file:\n');
    console.log('# Kafka Certificates (Base64 encoded)');
    console.log(`KAFKA_CA_CERT_BASE64=${caBase64}`);
    console.log(`KAFKA_CLIENT_CERT_BASE64=${certBase64}`);
    console.log(`KAFKA_CLIENT_KEY_BASE64=${keyBase64}`);
    console.log('\n✅ Done! Add these to your .env file');

} catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Make sure certificate files exist in src/config/');
}
