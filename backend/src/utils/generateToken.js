import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error("Missing JWT_SECRET in environment variables");
}

const userData = {
  id: "123",
  name: "Deep",
};

console.log("\n🔐 Generating JWT token...\n");

const signedToken = jwt.sign(userData, jwtSecret, {
  expiresIn: "1h",
  algorithm: "HS256",
});

console.log("✅ Token created:\n", signedToken);

console.log("\n🔎 Checking token validity...\n");

try {
  const verifiedData = jwt.verify(signedToken, jwtSecret, {
    algorithms: ["HS256"],
  });

  console.log("✅ Verified token payload:");
  console.log(verifiedData);
} catch (err) {
  // const error = err as Error;
  console.error("❌ Token verification failed:", error.message);
}
