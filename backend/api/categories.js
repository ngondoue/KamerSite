import express from "express";
import Category from "../models/Category.js";
import Place from "../models/Place.js";

const router = express.Router();


// get active categories
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

//  create a category
router.post("/", protect, requireAdmin, async (req, res) => {
    try {
        const {
            name,
            description,
            image,
            icon,
            status
        } = req.body;


        if (!name) {
            return res.status(400).json({
                message: "Category name is required"
            });
        }


        const category = await Category.create({
            name,
            description,
            image,
            icon,
            status
        });


        res.status(201).json(category);

    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
});


// update categor
router.put("/:id", protect, requireAdmin, async (req, res) => {
    try {
        const {
            name,
            description,
            image,
            icon,
            status
        } = req.body;


        const category = await Category.findByIdAndUpdate(
            req.params.id,
            {
                name,
                description,
                image,
                icon,
                status
            },
            {
                new: true,
                runValidators: true
            }
        );


        if (!category) {
            return res.status(404).json({
                message: "Category not found"
            });
        }


        res.json(category);

    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
});


// delete category
router.delete("/:id", protect, requireAdmin, async (req, res) => {
    try {
        const placeCount = await Place.countDocuments({
            category: req.params.id
        });


        if (placeCount > 0) {
            return res.status(409).json({
                message: "Cannot delete a category that has places"
            });
        }


        const category = await Category.findByIdAndDelete(
            req.params.id
        );


        if (!category) {
            return res.status(404).json({
                message: "Category not found"
            });
        }


        res.json({
            message: "Category deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error"
        });
    }
});


export default router;