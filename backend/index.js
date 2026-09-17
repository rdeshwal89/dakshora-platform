const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");

const app = express();

app.use(cors());
app.use(express.json());

// Supabase connection
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Home
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "DAKSHORA Backend is running 🚀"
  });
});

// Supabase connection test
app.get("/api/supabase-test", async (req, res) => {
  try {
    const url = process.env.SUPABASE_URL + "/rest/v1/";

    const response = await fetch(url, {
      method: "GET",
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization:
          "Bearer " + process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    });

    if (!response.ok) {
      throw new Error("Supabase returned status " + response.status);
    }

    res.json({
      success: true,
      message: "DAKSHORA Backend is connected to Supabase ✅"
    });

  } catch (error) {
    console.error("Supabase connection error:", error.message);

    res.status(500).json({
      success: false,
      message: "Supabase connection failed",
      error: error.message
    });
  }
});

// Test database insert
app.post("/api/test-user", async (req, res) => {
  try {
    const { name, email } = req.body;

    const { data, error } = await supabase
      .from("test_users")
      .insert([
        {
          name,
          email
        }
      ])
      .select();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: "User inserted into Supabase ✅",
      data
    });
  } catch (error) {
    console.error("Database insert error:", error.message);

    res.status(500).json({
      success: false,
      message: "Database insert failed",
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    "DAKSHORA Backend running on http://localhost:" + PORT
  );
});