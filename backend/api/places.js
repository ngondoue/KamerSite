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

// Get nearby places
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


// Add a place
router.post("/", protect, requireAdmin, async (req, res) => {
    try {
        const place = await Place.create(req.body);

        res.status(201).json(place);

    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
});


// Update a place
router.put("/:id", protect, requireAdmin, async (req, res) => {
    try {
        const place = await Place.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );


        if (!place) {
            return res.status(404).json({
                message: "Place not found"
            });
        }


        res.json(place);

    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
});


// Delete a place
router.delete("/:id", protect, requireAdmin, async (req, res) => {
    try {
        const place = await Place.findByIdAndDelete(req.params.id);

        if (!place) {
            return res.status(404).json({
                message: "Place not found"
            });
        }


        res.json({
            message: "Place deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error"
        });
    }
});


// Calculate distance between two locations
function getDistance(point1, point2) {
    const R = 6371;

    const lat1 = point1.lat * Math.PI / 180;
    const lat2 = point2.lat * Math.PI / 180;

    const latDifference =
        (point2.lat - point1.lat) * Math.PI / 180;

    const lngDifference =
        (point2.lng - point1.lng) * Math.PI / 180;


    const a =
        Math.sin(latDifference / 2) *
        Math.sin(latDifference / 2) +
        Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(lngDifference / 2) *
        Math.sin(lngDifference / 2);


    const c = 2 * Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
    );


    return R * c;
}



export default router;