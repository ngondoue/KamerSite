import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./api/auth.js";
import categoryRoutes from "./api/categories.js";
import connectDB from "./config/db.js";



dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
connectDB();


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});