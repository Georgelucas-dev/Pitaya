import "dotenv/config";
import express from "express";
import cors from "cors";
import chatRoutes from "./routes/chat.js";

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/chat", chatRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Pitaya is running!" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});