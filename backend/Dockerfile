# Use Node.js base image
FROM node:22-alpine AS base

# Set working directory
WORKDIR /app

# Copy files
COPY package*.json ./
RUN npm install --omit=dev

COPY server.js .
COPY schema.json .
COPY book.schema.json .
COPY recipe.schema.json .
COPY tag.schema.json .
COPY favorites.schema.json .
COPY db.json ./
COPY users ./users
COPY migrations ./migrations
COPY test/data ./test/data

RUN mkdir -p public/uploads

# Final stage
FROM node:22-alpine

# Install GraphicsMagick on Alpine
RUN apk add --no-cache graphicsmagick

WORKDIR /app
COPY --from=base /app /app

# Expose port
EXPOSE 3010

# Start the server
CMD ["npm", "start"]
