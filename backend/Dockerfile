# Use Node.js base image
FROM node:22-alpine AS base

# Set working directory
WORKDIR /app

# Copy files
COPY package*.json ./
RUN npm install --omit=dev

COPY server.js .
COPY schema.json .
COPY recipe.schema.json .
COPY tag.schema.json .
COPY favorites.schema.json .
COPY db.json ./
COPY users ./users

RUN mkdir -p public/uploads

FROM node:22-alpine

WORKDIR /app

COPY --from=base /app /app

# Expose port
EXPOSE 3010

# Start the server
CMD ["npm", "start"]
