const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function main() {
    console.log('🌱 Seeding interests...');

    const interestNames = [
        // Programming Languages
        'javascript', 'typescript', 'python', 'java', 'csharp', 'go', 'rust', 'php', 'ruby', 'kotlin',

        // Frontend
        'react', 'vue', 'angular', 'nextjs', 'svelte', 'tailwind', 'html', 'css',

        // Backend
        'nodejs', 'express', 'django', 'flask', 'spring-boot', 'dotnet',

        // Mobile
        'react-native', 'flutter', 'ios', 'android', 'mobile-development',

        // AI & Data
        'ai', 'machine-learning', 'deep-learning', 'data-science', 'data-analysis', 'nlp', 'computer-vision',

        // Web3 & Blockchain
        'blockchain', 'web3', 'ethereum', 'solidity', 'nft', 'defi',

        // DevOps & Cloud
        'devops', 'aws', 'azure', 'gcp', 'cloud', 'kubernetes', 'docker', 'ci-cd', 'terraform',

        // Databases
        'mongodb', 'postgresql', 'mysql', 'redis', 'sql', 'nosql',

        // Development
        'web-development', 'fullstack', 'frontend', 'backend', 'game-development', 'api-development',

        // Design & Creative
        'design', 'ui-ux', 'figma', 'photoshop', 'illustration', 'animation', '3d-modeling',

        // Business & Marketing
        'startup', 'entrepreneurship', 'marketing', 'seo', 'digital-marketing', 'saas',

        // Finance & Trading
        'finance', 'trading', 'cryptocurrency', 'stocks', 'investing',

        // Other Tech
        'cybersecurity', 'networking', 'iot', 'embedded-systems', 'robotics',
        'open-source', 'contributing', 'learning', 'teaching', 'mentoring',

        // Creative & Lifestyle
        'photography', 'music', 'art', 'gaming', 'esports', 'streaming'
    ];

    for (const name of interestNames) {
        await db.interest.upsert({
            where: { name },
            update: {},
            create: { name }
        });
        console.log(`✓ Created interest: ${name}`);
    }

    console.log(`\n✅ Successfully seeded ${interestNames.length} interests!`);
}

main()
    .catch((error) => {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });
