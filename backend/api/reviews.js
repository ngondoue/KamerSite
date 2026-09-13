import express from "express";
import mongoose from "mongoose";

import Favorite from "../models/Favorite.js";
import Place from "../models/Place.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

// get logged-in user's favorites
router.get("/", async (req, res) => {
    try {
        const favorites = await Favorite.find({
            user: req.user._id
        })
            .populate({
                path: "place",
                populate: {
                    path: "category",
                    select: "name slug icon"
                }
            })
            .sort({ createdAt: -1 });

        res.json(favorites);
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});

// add a favorite
router.post("/", async (req, res) => {
    try {
        const { placeId } = req.body;

        if (!placeId) {
            return res.status(400).json({
                message: "Place ID is required"
            });
        }

        if (!mongoose.isValidObjectId(placeId)) {
            return res.status(400).json({
                message: "Invalid place ID"
            });
        }

        const place = await Place.findOne({
            _id: placeId,
            status: "published"
        });

        if (!place) {
            return res.status(404).json({
                message: "Place not found"
            });
        }

        const existingFavorite = await Favorite.findOne({
            user: req.user._id,
            place: placeId
        });

        if (existingFavorite) {
            return res.status(409).json({
                message: "Place is already in favorites"
            });
        }

        const favorite = await Favorite.create({
            user: req.user._id,
            place: placeId
        });

        res.status(201).json(favorite);
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});
// Remove a favorite
router.delete("/:placeId", async (req, res) => {
    try {
        const { placeId } = req.params;

        if (!mongoose.isValidObjectId(placeId)) {
            return res.status(400).json({
                message: "Invalid place ID"
            });
        }

        const favorite = await Favorite.findOneAndDelete({
            user: req.user._id,
            place: placeId
        });

        if (!favorite) {
            return res.status(404).json({
                message: "Favorite not found"
            });
        }

        res.json({
            message: "Removed from favorites"
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});


export default router;