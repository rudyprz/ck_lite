import { Elysia } from "elysia";
import { Database } from "bun:sqlite";

// Utility functions for database operations
const createDatabaseOperations = (db: Database) => ({
  initializeSchema: () => {
    db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        platform TEXT NOT NULL,
        order_data TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  },

  saveOrder: (platform: string, orderData: any) => {
    const stmt = db.prepare(
      "INSERT INTO orders (platform, order_data, status) VALUES (?, ?, ?)"
    );
    return stmt.run(platform, JSON.stringify(orderData), "received");
  },

  getOrder: (id: number) => {
    const stmt = db.prepare("SELECT * FROM orders WHERE id = ?");
    return stmt.get(id);
  },
});

// Platform integration functions
const createPlatformIntegration = (db: Database) => ({
  uberEats: {
    processOrder: async (orderData: any) => {
      // Validate Uber Eats specific order structure
      const validatedOrder = validateUberEatsOrder(orderData);

      // Save order to database
      const dbOps = createDatabaseOperations(db);
      return dbOps.saveOrder("uber_eats", validatedOrder);
    },
  },

  rappi: {
    processOrder: async (orderData: any) => {
      // Validate Rappi specific order structure
      const validatedOrder = validateRappiOrder(orderData);

      // Save order to database
      const dbOps = createDatabaseOperations(db);
      return dbOps.saveOrder("rappi", validatedOrder);
    },
  },

  didiFood: {
    processOrder: async (orderData: any) => {
      // Validate Didi Food specific order structure
      const validatedOrder = validateDidiFoodOrder(orderData);

      // Save order to database
      const dbOps = createDatabaseOperations(db);
      return dbOps.saveOrder("didi_food", validatedOrder);
    },
  },
});

// Order validation functions
const validateUberEatsOrder = (order: any) => {
  // Implement Uber Eats specific validation
  if (!order.orderId || !order.restaurantId) {
    throw new Error("Invalid Uber Eats order structure");
  }
  return {
    ...order,
    processedAt: new Date().toISOString(),
  };
};

const validateRappiOrder = (order: any) => {
  // Implement Rappi specific validation
  if (!order.code || !order.total) {
    throw new Error("Invalid Rappi order structure");
  }
  return {
    ...order,
    processedAt: new Date().toISOString(),
  };
};

const validateDidiFoodOrder = (order: any) => {
  // Implement Didi Food specific validation
  if (!order.orderNumber || !order.merchantId) {
    throw new Error("Invalid Didi Food order structure");
  }
  return {
    ...order,
    processedAt: new Date().toISOString(),
  };
};

// Configuration and environment setup
const createConfig = () => ({
  database: {
    filename: process.env.DB_FILE || "./food_delivery.sqlite",
  },
  server: {
    port: process.env.PORT || 3000,
  },
});

// Main application setup function
const createFoodDeliveryApp = () => {
  // Initialize configuration
  const config = createConfig();

  // Create database connection
  const db = new Database(config.database.filename);

  // Initialize database schema
  const dbOps = createDatabaseOperations(db);
  dbOps.initializeSchema();

  // Create platform integrations
  const platformIntegrations = createPlatformIntegration(db);

  // Create Elysia server
  const app = new Elysia();

  // Setup webhook routes
  app.post("/webhook/uber-eats", async ({ body }) => {
    try {
      const response = await platformIntegrations.uberEats.processOrder(body);
      console.log("uberEatsResponse", response);
      return { status: "success", message: "Uber Eats order processed" };
    } catch (error) {
      console.log("uberEatsError", error);
      return {
        status: "error",
        message: error instanceof Error ? error.message : "Processing failed",
      };
    }
  });

  app.post("/webhook/rappi", async ({ body }) => {
    try {
      const response = await platformIntegrations.rappi.processOrder(body);
      console.log("rappiResponse", response);
      return { status: "success", message: "Rappi order processed" };
    } catch (error) {
      console.log("rappiError", error);
      return {
        status: "error",
        message: error instanceof Error ? error.message : "Processing failed",
      };
    }
  });

  app.post("/webhook/didi-food", async ({ body }) => {
    try {
      const response = await platformIntegrations.didiFood.processOrder(body);
      console.log("didiFoodResponse", response);
      return { status: "success", message: "Didi Food order processed" };
    } catch (error) {
      console.log("didiFoodError", error);
      return {
        status: "error",
        message: error instanceof Error ? error.message : "Processing failed",
      };
    }
  });

  // Start the server
  return {
    start: () => {
      app.listen(config.server.port, () => {
        console.log(
          `🚀 Food Delivery Integration running on port ${config.server.port}`
        );
      });
    },
  };
};

// Application startup
const foodDeliveryApp = createFoodDeliveryApp();
foodDeliveryApp.start();
