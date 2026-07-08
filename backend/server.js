const express = require("express");
const cors = require("cors");

const ADMIN_PASSWORD = "ict168mit";



app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Backend Running"
  });
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});