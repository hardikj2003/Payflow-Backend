import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(__dirname, "../../../.env"),
});

export const env = {
  databaseUrl: process.env.DATABASE_URL as string,
};

if (!env.databaseUrl) {
  throw new Error("DATABASE_URL is not defined");
}
