FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy prisma schema and generate client
COPY prisma ./prisma/
COPY prisma.config.ts ./
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Verify build succeeded
RUN ls -la dist/src/ && test -f dist/src/server-auth.js

# Expose port
EXPOSE 5000

# Start the server
CMD ["npm", "start"]
