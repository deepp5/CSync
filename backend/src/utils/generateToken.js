import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const SECRET = process.env.JWT_SECRET || "local_dev_secret";

const payload = {
  id: 123,
  name: "Deep",
};

console.log("\n🔐 Creating token...\n");

const token = jwt.sign(payload, SECRET, { expiresIn: "1h" });

console.log("✅ Generated Token:\n");
console.log(token);

// Verify token
console.log("\n🔎 Verifying token...\n");

try {
  const decoded = jwt.verify(token, SECRET);
  console.log("✅ Token is valid:");
  console.log(decoded);
} catch (err) {
  console.error("❌ Invalid token:", err.message);
}
