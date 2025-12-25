import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config(); // ✅ load .env first

const SECRET = process.env.JWT_SECRET || "local_dev_secret";
const payload = { id: 123, name: "Deep" };

const token = jwt.sign(payload, SECRET, { expiresIn: "1h" });

console.log("✅ Your local test token:\n");
console.log(token);
