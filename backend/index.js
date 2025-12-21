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

//Get all posts
app.get("/posts", async (req, res) => {
  try{
    const header = req.headers.authorization;
    if (!header) {
      return res.status(401).json({ error: "Missing Authorization header" });
    }
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

//Create a post
app.post("/posts", async (req, res) => {
  try{
    const head = req.headers.authorization;
    if (!head) {
      return res.status(401).json({ err: "Missing Authorization header" });
    }
    const token = head.split(' ')[1];
    const {data, error} = await supabase.auth.getUser(token);

    if(error || !data.user){
      return res.status(401).json({err: "Invalid token ;["});
    }

    const userId = data.user.id;

    const {title, header, techStack, description, category, difficulty, deadline} = req.body;

    if (!title || !header || !description || !category || !difficulty || !deadline) {
      return res.status(400).json({ err: "Missing required fields" });
    }

    const post = await prisma.post.create({
      data: {
        title,
        header,
        description,
        techStack,
        category,
        difficulty,
        deadline: new Date(deadline),
        userId
      }
    });

    res.status(201).json(post);
  }catch (err){
    console.error("POST error ;[ ", err);
    res.status(500).json({err: "Failed to post"});
  }
}); 

//Edit a post
app.put("/posts/:id", async (req, res) => {
  try{
    const head = req.headers.authorization;
    if(!head){
      res.status(401).json({error: "Missing Authorization header"});
      return;
    }
    const token = head.split(' ')[1];
    const {data, error} = await supabase.auth.getUser(token);

    if(error || !data.user){
      res.status(401).json({err: "Invalid token ;["});
    }

    const userId = data.user.id;
    const postId = req.params.id;

    const existingPost = await prisma.post.findUnique({
      where: { id: postId }
    });

    if(!existingPost || existingPost.userId != userId){
      res.status(403).json({err: "Not authorized to edit this post"});
    }

    const {title, header, techStack, description, category, difficulty, deadline} = req.body;
    if (!title || !header || !description || !category || !difficulty || !deadline) {
      return res.status(400).json({ err: "Missing required fields" });
    }

    const post = await prisma.post.update({
      where:{ id: postId},
      data:{
        title,
        header,
        techStack,
        description,
        category,
        difficulty,
        deadline: new Date(deadline),
      }
    });
    res.json(post);
  }catch (err){
    console.error("PUT error :[ ", err);
    res.status(500).json({err: "Failed to edit post."})
  }
});

//Delete a post
app.delete("/posts/:id", async (req, res) => {
  try{
    const header = req.headers.authorization;
    if(!header){
      res.status(401).json({error: "Missing Authorization header"});
      return;
    }
  
    const token = header.split(' ')[1];
    const {data, error} = await supabase.auth.getUser(token);

    if(error || !data.user){
      res.status(401).json({error: "Invalid token ;["});
      return;
    }

    const userId = data.user.id;
    const postId = req.params.id;

    const existingPost = await prisma.post.findUnique({
      where: {id: postId}
    });

    if(!existingPost || existingPost.userId != userId){
      res.status(403).json({err: "Not authorized to delete this post"});
      return;
    }

    await prisma.post.delete({
      where: {id: postId}
    });
    res.status(200).json({message: "Post deleted"});
  }catch (err){
    console.error("DELETE failed ;{", err);
    res.status(500).json({err: "Failed to delete :["});
  }
});

//Get only users posts
app.get("/posts/me", async (req, res) => {
  try{
    const header = req.headers.authorization;
    if(!header){
      res.status(401).json({error: "Missing Authorization header"});
      return;
    }
    const token = header.split(' ')[1];
    const {data, error} = await supabase.auth.getUser(token);

    if(error || !data.user){
      res.status(401).json({error: "Invalid token ;[ "});
      return;
    }

    const userId = data.user.id;

    const posts = await prisma.post.findMany({
      where: {userId},
      orderBy: {createdAt: "desc"}
    })
    res.status(200).json(posts);
  }catch (err){
    console.error("GET my posts failed :[ ", err);
    res.status(500).json({err: "Failure"});
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
