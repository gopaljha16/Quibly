// Script to fix usernames that are emails
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function fixUsernames() {
  try {
    console.log('🔍 Finding users with email as username...');
    
    // Get all users
    const users = await db.user.findMany();
    
    let fixed = 0;
    
    for (const user of users) {
      // Check if username looks like an email
      if (user.username.includes('@')) {
        // Extract username from email (part before @)
        const newUsername = user.username.split('@')[0];
        
        console.log(`Fixing user: ${user.username} -> ${newUsername}`);
        
        await db.user.update({
          where: { id: user.id },
          data: { username: newUsername }
        });
        
        fixed++;
      }
    }
    
    console.log(`✅ Fixed ${fixed} users`);
    console.log('Done!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.$disconnect();
  }
}

fixUsernames();
