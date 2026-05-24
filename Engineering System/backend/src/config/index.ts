import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "4000"),
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/selfhealing",
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  openaiKey: process.env.OPENAI_API_KEY || "",
  github: {
    token: process.env.GITHUB_TOKEN || "",
    owner: process.env.GITHUB_OWNER || "",
    repo: process.env.GITHUB_REPO || "",
  },
  autoFixEnabled: process.env.AUTO_FIX_ENABLED === "true",
  nodeEnv: process.env.NODE_ENV || "development",
};

