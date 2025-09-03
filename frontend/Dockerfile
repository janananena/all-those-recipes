# Step 1: Build the app
FROM node:22 AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Step 2: Serve with NGINX
FROM nginx:alpine

# Copy built files to NGINX web root
COPY --from=builder /app/dist /usr/share/nginx/html/all-recipes/

# Use custom NGINX config (if needed)
COPY ./default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]