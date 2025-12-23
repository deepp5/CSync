import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

let cachedClient = null;

function getSupabaseUrl() {
  const url = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
  if (!url) throw new Error("SUPABASE_URL missing in .env");
  return url;
}

function getJwksClient() {
  if (cachedClient) return cachedClient;

  const SUPABASE_URL = getSupabaseUrl();
  cachedClient = jwksClient({
    jwksUri: `${SUPABASE_URL}/auth/v1/.well-known/jwks.json`,
    cache: true,
    cacheMaxEntries: 5,
    cacheMaxAge: 10 * 60 * 1000,
    rateLimit: true,
    jwksRequestsPerMinute: 10,
  });

  return cachedClient;
}

function getKey(header, callback) {
  if (!header?.kid) return callback(new Error("Missing kid in JWT header"));

  getJwksClient().getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key.getPublicKey());
  });
}

export const verifySupabaseToken = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res
      .status(401)
      .json({ error: "Missing Authorization: Bearer <token>" });
  }

  const SUPABASE_URL = getSupabaseUrl();

  jwt.verify(
    token,
    getKey,
    {
      issuer: `${SUPABASE_URL}/auth/v1`,
      audience: "authenticated",
      algorithms: ["ES256", "RS256"],
    },
    (err, decoded) => {
      if (err) {
        console.error("JWT verification failed:", err.message);
        return res.status(403).json({ error: "Invalid token" });
      }

      // DEBUG: Log the entire decoded token
      console.log(
        "[DEBUG] Full decoded token:",
        JSON.stringify(decoded, null, 2)
      );
      console.log("[DEBUG] decoded.sub:", decoded?.sub);
      console.log("[DEBUG] decoded.email:", decoded?.email);
      console.log("[DEBUG] decoded.user_metadata:", decoded?.user_metadata);

      // Attach user data from token
      req.user = {
        sub: decoded?.sub,
        id: decoded?.sub,
        email: decoded?.email,
        user_metadata: decoded?.user_metadata || {},
      };

      console.log(
        "[SUCCESS] req.user set to:",
        JSON.stringify(req.user, null, 2)
      );

      if (!req.user.id || !req.user.email) {
        console.error("[ERROR] Bad supabase payload:", decoded);
        return res.status(401).json({ error: "Token missing id/email claims" });
      }

      next();
    }
  );
};
