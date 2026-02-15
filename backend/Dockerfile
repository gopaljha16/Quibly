FROM oven/bun:1 AS base

WORKDIR /app

# Install dependencies (without lock file to avoid conflicts)
COPY package.json ./
RUN bun install --production

# Copy application code
COPY . .

# Generate Prisma Client
RUN bunx prisma generate

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD bun -e "fetch('http://localhost:5000/health').then(r => process.exit(r.ok ? 0 : 1))"

# Start application with Bun
CMD ["bun", "run", "src/index.js"]
