import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();
const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.send("Backend working 🚀");
});

// Example: fetch users
app.get("/users", async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

// Example: create user
app.post("/users", async (req, res) => {
  const { name, email } = req.body;
  const newUser = await prisma.user.create({
    data: { name, email },
  });
  res.json(newUser);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:5000`));
