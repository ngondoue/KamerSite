import express from "express";
import Category from "../models/Category.js";
import Place from "../models/Place.js";
import { protect, requireAdmin } from "../middleware/auth.js";

const router = express.Router();


// Get active categories
router.get("/", async (req, res) => {
    try {
        const categories = await Category.find({
            status: "active"
        }).sort({ name: 1 });

        res.json(categories);

    } catch (error) {
        res.status(500).json({
            message: "Server error"
        });
    }
});


// get one category
router.get("/:id", async (req, res) => {
    try {
        const category = await Category.findOne({
            $or: [
                { _id: req.params.id },
                { slug: req.params.id }
            ]
        });

        if (!category) {
            return res.status(404).json({
                message: "Category not found"
            });
        }

        res.json(category);

    } catch (error) {
        res.status(500).json({
            message: "Server error"
        });
    }
});


// get places in a category
router.get("/:id/places", async (req, res) => {
    try {
        const category = await Category.findOne({
            $or: [
                { _id: req.params.id },
                { slug: req.params.id }
            ]
        });

        if (!category) {
            return res.status(404).json({
                message: "Category not found"
            });
        }


        const places = await Place.find({
            category: category._id,
            status: "published"
        }).sort({ createdAt: -1 });


        res.json({
            category,
            places
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error"
        });
    }
});

export default router;