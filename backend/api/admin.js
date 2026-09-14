import express from "express";

import User from "../models/User.js";
import Place from "../models/Place.js";
import Category from "../models/Category.js";
import Review from "../models/Review.js";

import { protect, requireAdmin } from "../middleware/auth.js";

const router = express.Router();


// All admin routes require admin login
router.use(protect, requireAdmin);


// Get dashboard statistics for users, places, categories, and review


router.get("/dashboard", async (req, res) => {
    try {
        const totalPlaces = await Place.countDocuments();
        const publishedPlaces = await Place.countDocuments({
            status: "published"
        });
        const draftPlaces = await Place.countDocuments({
            status: "draft"
        });
        const categories = await Category.countDocuments();
        const users = await User.countDocuments();
        const reviews = await Review.countDocuments();

        res.json({
            totalPlaces,
            publishedPlaces,
            draftPlaces,
            categories,
            users,
            reviews
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});

// get all places for Admin
router.get("/places", async (req, res) => {
    try {
        const filter = {};

        if (req.query.status) {
            filter.status = req.query.status;
        }

        const places = await Place.find(filter)
            .populate("category", "name slug")
            .sort({ createdAt: -1 });

        res.json(places);
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});

// get one place for admin
router.get("/places/:id", async (req, res) => {
    try {
        const place = await Place.findById(req.params.id)
            .populate("category", "name slug icon");

        if (!place) {
            return res.status(404).json({
                message: "Place not found"
            });
        }

        res.json(place);
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});



export default router;