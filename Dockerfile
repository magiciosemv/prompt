FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/

# Install dependencies
RUN npm install
RUN cd client && npm install
RUN cd server && npm install

# Copy source
COPY . .

# Build frontend
RUN cd client && npm run build

# Create data directory
RUN mkdir -p /app/data

EXPOSE 3001

CMD ["node", "server/src/index.js"]
