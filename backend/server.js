import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./api/auth.js";
import categoryRoutes from "./api/categories.js";
<<<<<<< HEAD
import placesRoutes from "./api/places.js"
=======
import favoriteRoutes from "./api/favorites.js";
>>>>>>> 98764a87a0072ec3ad79bbd8cc55acd6330e9cc0
import connectDB from "./config/db.js";



dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
<<<<<<< HEAD
app.use("/api/places", placesRoutes)
=======
app.use("/api/favorites", favoriteRoutes);
>>>>>>> 98764a87a0072ec3ad79bbd8cc55acd6330e9cc0
connectDB();


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});