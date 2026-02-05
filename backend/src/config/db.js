// const { PrismaClient } = require('@prisma/client')
// require('dotenv').config()

// // Use global object to prevent multiple Prisma instances in dev
// const globalForPrisma = global

// const db =
//   globalForPrisma.prisma ||
//   new PrismaClient({})

// if (process.env.NODE_ENV !== 'production') {
//   globalForPrisma.prisma = db
// }

// // Test database connection
// db.$connect()
//   .then(() => console.log('✓ Database connected successfully'))
//   .catch((err) => console.error('✗ Database connection failed:', err.message))

// module.exports = db


const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')

const globalForPrisma = global

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})

const db  =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

module.exports = db
