import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

app.use(cors());
app.use(express.json());

// Root route
app.get("/", (req, res) => {
  res.send("Backend working 🚀");
});

// Fetch all users
app.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Create new user
app.post("/users", async (req, res) => {
  try {
    const { name, email } = req.body;

    const newUser = await prisma.user.create({
      data: { name, email },
    });
    
    res.json(newUser);
  } catch (err) {
    console.error("Error creating user:", err);

    if (err.code === "P2002") {
      return res.status(400).json({ error: "Email already exists" });
    }

    res.status(500).json({ error: "Server error" });
  }
});

// Get all posts
app.get("/posts", async (req, res) => {
  try{
    const header = req.headers.authorization;
    const token = header.split(' ')[1];
    const {data, error} = await supabase.auth.getUser(token);

    if(error || !data.user){
      return res.status(401).json({err: "Invalid token ;["});
    }

    const userId = data.user.id;

    const posts = await prisma.post.findMany({
      where:{
        NOT: {userId: userId}
      }
    });

    res.json(posts);
  }catch (err){
    console.error(err);
    res.status(500).json({err: "Server error"});
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
