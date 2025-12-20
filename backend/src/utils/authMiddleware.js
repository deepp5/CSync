import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

const client = jwksClient({
  jwksUri: `${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`,
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

export const verifySupabaseToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(
    token,
    getKey,
    {
      audience: "authenticated",
      issuer: `${process.env.SUPABASE_URL}/auth/v1`,
      algorithms: ["ES256"],
    },
    (err, decoded) => {
      if (err) {
        console.error("JWT verification failed:", err.message);
        return res.status(403).json({ error: "Invalid token" });
      }

      // Supabase user id
      req.user = {
        id: decoded.sub,
        email: decoded.email,
      };

      next();
    }
  );
};
