import app, { httpServer } from "./index.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 5050;

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🔒 HTTPS Server running on https://localhost:${PORT}`);
});