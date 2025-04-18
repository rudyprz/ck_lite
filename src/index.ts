import { Elysia } from "elysia";
import { Database } from "bun:sqlite";
import type { Order } from "./types/order";

enum uberEatsOrderType {
  ordersNotification = "orders.notification",
  ordersCancel = "orders.cancel",
}

type uberEatsWebhookBody = {
  event_id: string;
  event_type: uberEatsOrderType;
  event_time: string;
  resource_href: string;
  meta: {
    user_id: string;
    resource_id: string;
    status: string;
  };
  webhook_meta: {
    client_id: string;
    webhook_config_id: string;
    webhook_msg_timestamp: string;
    webhook_msg_uuid: string;
  };
};

type tokenAuthResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
};

const loginAuth0UberEats = async () => {
  const bodyParams = `client_id=${process.env.UBER_CLIENT_ID}&client_secret=${process.env.UBER_CLIENT_SECRET}&grant_type=client_credentials&scope=eats.order`;
  const response = await fetch("https://auth.uber.com/oauth/v2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: bodyParams,
  });
  const tokenResponse: tokenAuthResponse = await response.json();
  return tokenResponse;
};

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
    processOrder: async (orderData: Order) => {
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
const validateUberEatsOrder = (order: Order) => {
  // Implement Uber Eats specific validation
  if (!order.id || !order.current_state) {
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
  app.post(
    "/webhook/uber-eats",
    async ({ body }: { body: uberEatsWebhookBody }) => {
      console.log("uberEatsBody", body);
      switch (body.event_type) {
        case uberEatsOrderType.ordersNotification:
          console.log("order created");
          break;
        case uberEatsOrderType.ordersCancel:
          console.log("order cancelled");
          break;
      }
      try {
        const tokenResponse = await loginAuth0UberEats();
        console.log("tokenResponse", tokenResponse);
        const orderResponse = await fetch(body.resource_href, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
            "Content-Type": "application/json",
          },
        });
        const order = await orderResponse.json();
        console.log("uberEatsOrder", order);
        const response = await platformIntegrations.uberEats.processOrder(
          order
        );
        console.log("uberEatsResponse", response);
        return { status: "success", message: "Uber Eats order processed" };
      } catch (error) {
        console.log("uberEatsError", error);
        return {
          status: "error",
          message: error instanceof Error ? error.message : "Processing failed",
        };
      }
    }
  );

  app.post("/webhook/rappi", async ({ body }) => {
    console.log("rappiBody", body);
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
    console.log("didiFoodBody", body);
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
