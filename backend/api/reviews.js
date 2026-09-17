import express from "express";
import mongoose from "mongoose";

import Review from "../models/Reviews.js";
import Place from "../models/Place.js";
import { protect, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Get approved reviews for a published place.
router.get("/place/:placeId", async (req, res) => {
    try {
        const { placeId } = req.params;

        if (!mongoose.isValidObjectId(placeId)) {
            return res.status(400).json({ message: "Invalid place ID" });
        }

        const reviews = await Review.find({
            place: placeId,
            status: "approved"
        })
            .populate("user", "name profileImage")
            .sort({ createdAt: -1 });

        res.json(reviews);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// Create a review.
router.post("/", protect, async (req, res) => {
    try {
        const { place, rating, comment } = req.body;

        if (!place || rating === undefined) {
            return res.status(400).json({
                message: "Place and rating are required"
            });
        }

        if (!mongoose.isValidObjectId(place)) {
            return res.status(400).json({ message: "Invalid place ID" });
        }

        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            return res.status(400).json({
                message: "Rating must be an integer between 1 and 5"
            });
        }

        const placeExists = await Place.findOne({
            _id: place,
            status: "published"
        });

        if (!placeExists) {
            return res.status(404).json({ message: "Place not found" });
        }

        const existingReview = await Review.findOne({
            user: req.user._id,
            place
        });

        if (existingReview) {
            return res.status(409).json({
                message: "You have already reviewed this place"
            });
        }

        const review = await Review.create({
            user: req.user._id,
            place,
            rating,
            comment
        });

        res.status(201).json(review);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "You have already reviewed this place"
            });
        }

        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// Approve or reject a review and refresh the place rating.
router.put("/:id", protect, requireAdmin, async (req, res) => {
    try {
        const { status } = req.body;

        if (!["approved", "rejected", "pending"].includes(status)) {
            return res.status(400).json({ message: "Invalid review status" });
        }

        const review = await Review.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }

        await updatePlaceRating(review.place);
        res.json(review);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// Delete a review by its owner or an administrator.
router.delete("/:id", protect, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }

        const isOwner = review.user.toString() === req.user._id.toString();
        const isAdmin = req.user.role === "admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: "Access denied" });
        }

        await review.deleteOne();
        await updatePlaceRating(review.place);

        res.json({ message: "Review deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

async function updatePlaceRating(placeId) {
    const result = await Review.aggregate([
        {
            $match: {
                place: new mongoose.Types.ObjectId(placeId),
                status: "approved"
            }
        },
        {
            $group: {
                _id: null,
                rating: { $avg: "$rating" },
                reviewCount: { $sum: 1 }
            }
        }
    ]);

    const summary = result[0] || { rating: 0, reviewCount: 0 };

    await Place.findByIdAndUpdate(placeId, {
        rating: summary.rating,
        reviewCount: summary.reviewCount
    });
}

export default router;
