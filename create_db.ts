import { Database } from "bun:sqlite";

// Database initialization function
function initializeDatabase(dbPath: string = "./food_delivery.sqlite") {
  // Create or open the database
  const db = new Database(dbPath);

  try {
    // Create orders table
    db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        platform TEXT NOT NULL,
        order_data TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create restaurants table
    db.run(`
      CREATE TABLE IF NOT EXISTS restaurants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        platform TEXT NOT NULL,
        external_id TEXT NOT NULL,
        contact_email TEXT,
        phone_number TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create customers table
    db.run(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        phone_number TEXT,
        platform_customer_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create unique indexes for performance and data integrity
    db.run(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_platform_external_id 
      ON orders (platform, json_extract(order_data, '$.orderId'))
    `);

    db.run(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_restaurants_platform_external_id 
      ON restaurants (platform, external_id)
    `);

    // Seed some initial data (optional)
    const insertRestaurant = db.prepare(`
      INSERT OR IGNORE INTO restaurants 
      (name, platform, external_id, contact_email, phone_number) 
      VALUES (?, ?, ?, ?, ?)
    `);

    const restaurantsData = [
      [
        "Pizza Palace",
        "uber_eats",
        "UBEREATS_001",
        "contact@pizzapalace.com",
        "123-456-7890",
      ],
      [
        "Sushi Spot",
        "rappi",
        "RAPPI_001",
        "info@sushispot.com",
        "987-654-3210",
      ],
      [
        "Burger Haven",
        "didi_food",
        "DIDIFOOD_001",
        "hello@burgerhaven.com",
        "456-789-0123",
      ],
    ];

    // Use a transaction for better performance
    db.run("BEGIN TRANSACTION");
    for (const restaurant of restaurantsData) {
      insertRestaurant.run(...restaurant);
    }
    db.run("COMMIT");

    console.log("Database initialized successfully!");
  } catch (error) {
    console.error("Error initializing database:", error);
  } finally {
    // Close the database connection
    db.close();
  }
}

// Run the initialization
initializeDatabase();

// Export for potential reuse
export { initializeDatabase };
