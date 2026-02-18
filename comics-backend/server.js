require("dotenv").config();
const express = require("express");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());


db.pool.connect()
  .then(client => {
    console.log("PostgreSQL Connected!");
    client.release();
  })
  .catch(err => {
    console.error("PostgreSQL Connection Error:", err.message);
  });

