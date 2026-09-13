import express from "express";
import Place from "../models/Place.js";
import Category from "../models/Category.js";

const router = express.Router();


// get all published places
router.get("/", async (req, res) => {
    try {
        const {
            search,
            category,
            rating,
            price,
            activity
        } = req.query;

        const filter = {
            status: "published"
        };


        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
                { location: { $regex: search, $options: "i" } }
            ];
        }


        if (category) {
            const categoryData = await Category.findOne({
                $or: [
                    { _id: category },
                    { slug: category }
                ]
            });

            if (!categoryData) {
                return res.json([]);
            }

            filter.category = categoryData._id;
        }


        if (rating) {
            filter.rating = {
                $gte: Number(rating)
            };
        }


        if (price) {
            filter.priceRange = price;
        }


        if (activity) {
            filter.activities = activity;
        }


        const places = await Place.find(filter)
            .populate("category", "name slug icon")
            .sort({ createdAt: -1 });


        res.json(places);

    } catch (error) {
        res.status(500).json({
            message: "Server error"
        });
    }
});


// get one place
router.get("/:id", async (req, res) => {
    try {
        const place = await Place.findOne({
            $or: [
                { _id: req.params.id },
                { slug: req.params.id }
            ],
            status: "published"
        }).populate("category", "name slug icon");


        if (!place) {
            return res.status(404).json({
                message: "Place not found"
            });
        }


        res.json(place);

    } catch (error) {
        res.status(500).json({
            message: "Server error"
        });
    }
});

// get nearby places
router.get("/:id/nearby", async (req, res) => {
    try {
        const place = await Place.findById(req.params.id);

        if (!place) {
            return res.status(404).json({
                message: "Place not found"
            });
        }


        if (
            place.coordinates.lat === null ||
            place.coordinates.lng === null
        ) {
            return res.json([]);
        }


        const places = await Place.find({
            _id: { $ne: place._id },
            status: "published",
            "coordinates.lat": { $ne: null },
            "coordinates.lng": { $ne: null }
        }).populate("category", "name slug icon");


        const nearbyPlaces = places.map((item) => {
            const distance = getDistance(
                place.coordinates,
                item.coordinates
            );

            return {
                ...item.toObject(),
                distanceKm: Math.round(distance * 10) / 10
            };
        });


        nearbyPlaces.sort((a, b) => {
            return a.distanceKm - b.distanceKm;
        });


        res.json(nearbyPlaces.slice(0, 5));

    } catch (error) {
        res.status(500).json({
            message: "Server error"
        });
    }
});


export default router;