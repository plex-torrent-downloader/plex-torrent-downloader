FROM node:22

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm i

# Copy source code
COPY . .

# Setup environment and build
RUN cp .env.example .env
RUN npx prisma generate
RUN npx prisma migrate deploy
RUN npm run build

# Expose port
EXPOSE 3000

# Define expected volume mount points
VOLUME ["/mount"]

# Start the app
CMD ["npm", "run", "start"]
