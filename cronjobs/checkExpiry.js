const cron = require("node-cron");
const {connectDB}=require("../config/db")
const { AccessRequest } = require("../models/accessRequest"); 

// db connection
connectDB();


// =============================
// Runs every day at midnight
// =============================
cron.schedule("0 0 * * *", async () => {
  try {
    console.log("Running daily expiry check for access requests...");

    await AccessRequest.updateExpiries();

    console.log("Expiry check completed successfully.");
  } catch (error) {
    console.error("Error running expiry check:", error);
  }
}, {
  timezone: "Africa/Dar_es_Salaam" 
});
