const express = require("express");
const cors = require("cors"); // Import the cors package
const app = express();
const path = require("path");
const util = require("util");
const DBdriver = require("./utils/DBdriver");
const FSApi = require("./utils/FSApi");
const port = 3001;

// Use the cors middleware to enable CORS
app.use(cors());

app.use(express.json());

// Define your webhook route
app.post("/webhooks/fastspring", (req, res) => {
  try {
    // Check that request contains an events object
    if (req.body && Array.isArray(req.body.events)) {
      req.body.events.forEach((event) => {
        // Only process order.completed events
        // Check that the order was successfully completed
        if (event.type === "order.completed" && event.data.completed) {
          // Get FastSpring assigned accountId
          const accountId = event.data.account;
          // Get the orderId from the webhook payload (using id field)
          const orderId = event.data.id;
          // Let's check that this user is not already in our database
          const dbContent = DBdriver.getContent();
          if (!dbContent[accountId]) {
            // If user is not in the database, create a new entry
            dbContent[accountId] = {
              customerInfo: event.data.customer,
              orderIds: [orderId], // Initialize an array with the current orderId
            };
          } else {
            // If user is already in the database, update the orderIds array
            if (!dbContent[accountId].orderIds.includes(orderId)) {
              // Only add the orderId if it's not already present
              dbContent[accountId].orderIds.push(orderId);
            }
          }
          // Update the customer data in the database
          DBdriver.writeContent(dbContent);
        }
      });
    }
  } catch (err) {
    console.log(
      "An error has occurred while processing webhook: ",
      err.message
    );
  } finally {
    // Always make sure to acknowledge event
    res.sendStatus(200);
  }
  // Handle FastSpring webhook here
  console.log(
    "Received FastSpring webhook:",
    util.inspect(req.body, false, null, true)
  );
});

app.get("/api/get-email/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    // Make an API call to FastSpring using FSApi module
    const orderData = await FSApi.get(`/orders/${orderId}`);
    console.log(
      "orderId: " +
        orderData.id +
        " email: " +
        orderData.customer.email +
        " accountId: " +
        orderData.account
    );

    const dbContent = DBdriver.getContent();

    // Check if the user already has a password in the db.json
    if (orderData && orderData.account && orderData.customer.email) {
      const userPassword = dbContent[orderData.account]?.customerInfo.password;
      if (userPassword) {
        console.log("User already has a stored password");
        res.status(200).end(); // Respond with no content
      } else {
        // User does not have a stored password, send email and userId
        res.json({
          email: orderData.customer.email,
          userId: orderData.account,
        });
      }
    } else {
      res.status(404).json({ error: "Email not found for orderId" });
    }
  } catch (err) {
    console.error("Error getting email:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/create-account", (req, res) => {
  try {
    const { accountId, email, password } = req.body;

    // Load the existing content of db.json
    const dbContent = DBdriver.getContent();

    // Check if the account exists in the database
    if (dbContent[accountId]) {
      // Update the password for the account
      dbContent[accountId].customerInfo.password = password;

      // Write the updated content back to db.json
      DBdriver.writeContent(dbContent);

      res.sendStatus(200);
    } else {
      res.status(404).json({ error: "Account not found" });
    }
  } catch (err) {
    console.error("Error creating account:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`Express server listening on port ${port}`);
});
