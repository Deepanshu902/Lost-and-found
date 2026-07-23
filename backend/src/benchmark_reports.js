import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "./models/user.models.js";
import { Report } from "./models/report.models.js";

dotenv.config();

const DB_NAME = "Lost_and_found";

async function run() {
  try {
    console.log("Connecting to MongoDB...");
    let connectionString = `${process.env.MONGODB_URL}/${DB_NAME}`;
    
    // Parse connection string for WARP SRV fallback
    if (connectionString.startsWith("mongodb+srv://")) {
      const parts = connectionString.replace("mongodb+srv://", "").split("/");
      const credentialsAndHosts = parts[0].split("@");
      if (credentialsAndHosts.length === 2) {
        const credentials = credentialsAndHosts[0];
        connectionString = `mongodb://${credentials}@deepanshu-shard-00-00.g3fsq.mongodb.net:27017,deepanshu-shard-00-01.g3fsq.mongodb.net:27017,deepanshu-shard-00-02.g3fsq.mongodb.net:27017/${DB_NAME}?ssl=true&authSource=admin&replicaSet=atlas-2c0w59-shard-0`;
      }
    }

    try {
      await mongoose.connect(connectionString);
    } catch (connErr) {
      console.log("SRV connection failed, trying fallback connection string...");
      // Try without replica set name in case replica set name is different
      const fallbackNoRS = connectionString.split("&replicaSet=")[0];
      await mongoose.connect(fallbackNoRS);
    }
    console.log("Connected successfully.");

    // Find or create a test user
    let user = await User.findOne({});
    if (!user) {
      user = await User.create({
        username: "testuser_benchmark",
        email: "testuser_benchmark@example.com",
        password: "password123",
        name: "Benchmark User",
        number: "1234567890"
      });
      console.log("Created test user:", user._id);
    } else {
      console.log("Using existing user:", user._id);
    }

    // Clean up any existing benchmark reports first
    console.log("Cleaning up previous benchmark data...");
    await Report.deleteMany({ title: /^Benchmark Report/ });

    // Drop index if it already exists to start clean
    try {
      await Report.collection.dropIndex("createdAt_-1");
      console.log("Dropped existing createdAt index.");
    } catch (e) {
      // index didn't exist
    }

    console.log("Generating 3,000 mock reports...");
    const reportsToInsert = [];
    const baseDate = new Date();
    
    for (let i = 0; i < 3000; i++) {
      const createdAt = new Date(baseDate.getTime() - i * 60000);
      reportsToInsert.push({
        title: `Benchmark Report ${i}`,
        content: `Content for benchmark report number ${i}. Just adding some dummy text to make the document size somewhat realistic.`,
        location: `Location ${i % 10}`,
        status: i % 3 === 0 ? "Lost" : (i % 3 === 1 ? "Found" : "Returned"),
        owner: user._id,
        number: user.number,
        createdAt,
        updatedAt: createdAt
      });
    }

    console.log("Inserting reports in batches...");
    for (let i = 0; i < reportsToInsert.length; i += 2000) {
      await Report.insertMany(reportsToInsert.slice(i, i + 2000), { validateBeforeSave: false });
    }
    console.log("Inserted 3,000 reports.");

    // Measure WITHOUT index
    console.log("\n--- Running Query WITHOUT Index ---");
    // Warm up cache
    await Report.find({}).populate("owner", "name email number").sort({ createdAt: -1 }).limit(100);
    
    const startNoIndex = performance.now();
    const resultsNoIndex = await Report.find({})
      .populate("owner", "name email number")
      .sort({ createdAt: -1 });
    const endNoIndex = performance.now();
    const durationNoIndex = endNoIndex - startNoIndex;
    console.log(`Query duration: ${durationNoIndex.toFixed(2)}ms (found ${resultsNoIndex.length} reports)`);

    // Create Index
    console.log("\nCreating index on { createdAt: -1 }...");
    const indexStart = performance.now();
    await Report.collection.createIndex({ createdAt: -1 });
    const indexEnd = performance.now();
    console.log(`Index created in ${(indexEnd - indexStart).toFixed(2)}ms.`);

    // Measure WITH index
    console.log("\n--- Running Query WITH Index ---");
    // Warm up cache
    await Report.find({}).populate("owner", "name email number").sort({ createdAt: -1 }).limit(100);

    const startWithIndex = performance.now();
    const resultsWithIndex = await Report.find({})
      .populate("owner", "name email number")
      .sort({ createdAt: -1 });
    const endWithIndex = performance.now();
    const durationWithIndex = endWithIndex - startWithIndex;
    console.log(`Query duration: ${durationWithIndex.toFixed(2)}ms (found ${resultsWithIndex.length} reports)`);

    // Calculate improvement
    const diff = durationNoIndex - durationWithIndex;
    const pct = (diff / durationNoIndex) * 100;
    console.log(`\n======================================`);
    console.log(`Time without index: ${durationNoIndex.toFixed(2)} ms`);
    console.log(`Time with index:    ${durationWithIndex.toFixed(2)} ms`);
    console.log(`Improvement:        ${diff.toFixed(2)} ms (${pct.toFixed(1)}% faster)`);
    console.log(`======================================`);

    // Clean up
    console.log("\nCleaning up seeded reports...");
    await Report.deleteMany({ title: /^Benchmark Report/ });
    
    // Drop index
    await Report.collection.dropIndex("createdAt_-1");
    console.log("Index dropped. DB is clean.");

  } catch (error) {
    console.error("Benchmark failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

run();
