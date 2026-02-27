const path = require('path');
// Load environment variables from .env file
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Use the centralized db client configuration which handles the driver adapter
const db = require('../src/config/db');

async function main() {
    console.log('🌱 Starting interest seeding process...');

    // Merged list: includes all frontend INTERESTS_LIST names + original seed names
    const interestNames = [
        'gaming', 'music', 'art', 'technology', 'sports',
        'photography', 'cooking', 'fitness', 'reading', 'movies',
        'anime', 'coding', 'design', 'writing', 'travel',
        'fashion', 'science', 'history', 'languages', 'business',
        'marketing', 'education', 'health', 'meditation', 'yoga',
        'dance', 'theater', 'comedy', 'podcasts', 'streaming',
        'youtube', 'twitch', 'discord', 'memes',
        'crypto', 'investing', 'stocks', 'real-estate',
        'cars', 'motorcycles', 'aviation', 'space', 'astronomy',
        'physics', 'chemistry', 'biology', 'geology',
        'environment', 'sustainability', 'gardening', 'diy', 'crafts',
        'woodworking', 'electronics', 'robotics',
        'ai', 'machine-learning', 'cybersecurity', 'blockchain',
        'web-development', 'mobile-dev', 'game-dev',
        'ui-ux', 'graphic-design', '3d-modeling', 'animation',
        'video-editing', 'music-production', 'sound-design',
        'photography-editing', 'filmmaking', 'acting', 'voice-acting',
        'singing', 'instruments', 'guitar', 'piano', 'drums', 'bass', 'violin',
        'chess', 'board-games', 'card-games', 'puzzles',
        'esports', 'fps', 'moba', 'rpg', 'strategy',
        'simulation', 'indie-games', 'retro-gaming', 'vr', 'ar',
        'javascript', 'typescript', 'python', 'java', 'csharp', 'go', 'rust', 'php', 'ruby', 'kotlin',
        'react', 'vue', 'angular', 'nextjs', 'svelte', 'tailwind', 'html', 'css',
        'nodejs', 'express', 'django', 'flask', 'spring-boot', 'dotnet',
        'react-native', 'flutter', 'ios', 'android', 'mobile-development',
        'deep-learning', 'data-science', 'data-analysis', 'nlp', 'computer-vision',
        'web3', 'ethereum', 'solidity', 'nft', 'defi',
        'devops', 'aws', 'azure', 'gcp', 'cloud', 'kubernetes', 'docker', 'ci-cd', 'terraform',
        'mongodb', 'postgresql', 'mysql', 'redis', 'sql', 'nosql',
        'fullstack', 'frontend', 'backend', 'game-development', 'api-development',
        'figma', 'photoshop', 'illustration',
        'startup', 'entrepreneurship', 'seo', 'digital-marketing', 'saas',
        'finance', 'trading', 'cryptocurrency',
        'networking', 'iot', 'embedded-systems',
        'open-source', 'contributing', 'learning', 'teaching', 'mentoring',
    ];

    // Deduplicate
    const unique = [...new Set(interestNames)];
    console.log(`📊 Processing ${unique.length} unique interests...`);

    // Use createMany with skipDuplicates for MUCH faster execution
    // This is a single database trip instead of 139 sequential ones
    const result = await db.interest.createMany({
        data: unique.map(name => ({ name })),
        skipDuplicates: true
    });

    console.log(`\n✨ Seeding complete!`);
    console.log(`✅ Added ${result.count} new interests.`);
    console.log(`ℹ️  Total unique interests in list: ${unique.length}`);
}

main()
    .catch((error) => {
        console.error('\n❌ Error seeding database:', error);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });
