import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const SECRET = process.env.JWT_SECRET;

if (!SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

const payload = {
  id: "123", // should be string in most DBs
  name: "Deep",
};

console.log("\n🔐 Creating token...\n");

const token = jwt.sign(payload, SECRET, {
  expiresIn: "1h",
  algorithm: "HS256",
});

console.log("✅ Generated Token:\n");
console.log(token);

// Verify token
console.log("\n🔎 Verifying token...\n");

try {
  const decoded = jwt.verify(token, SECRET, {
    algorithms: ["HS256"],
  });

  console.log("✅ Token is valid:");
  console.log(decoded);
} catch (err) {
  console.error("❌ Invalid token:", err.message);
}
