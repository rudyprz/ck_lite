 # Use the official Bun image
FROM oven/bun:1 as builder

# Create app directory
WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the application (if needed)
# RUN bun run build

# Production stage
FROM oven/bun:1-slim

WORKDIR /app

# Copy from builder
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Create volume for SQLite database
VOLUME ["/app/data"]

# Set environment variables
ENV PORT=3000
ENV DB_FILE=/app/data/food_delivery.sqlite
ENV DB_CREATE=true
ENV DB_READONLY=false

# Expose the port
EXPOSE 3000

# Start the application
CMD ["bun", "run", "src/index.ts"]