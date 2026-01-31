FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application files
COPY server.js ./
COPY src ./src
COPY variables.json ./

EXPOSE 3000

CMD ["node", "server.js"]
