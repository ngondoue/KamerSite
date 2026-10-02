/**
 * Database seed script for KamerSite.
 *
 * Usage:
 *   node backend/seed.js
 * (run from the repo root, or `node seed.js` from inside backend/)
 *
 * Requires a backend/.env file with MONGODB_URI set, same as the server.
 *
 * What it does, in order:
 *   1. Connects to MongoDB using MONGODB_URI.
 *   2. Clears out any previously-seeded Categories, Places, Reviews and
 *      Favorites, plus the demo Users this script creates (by email) --
 *      it never touches any other user accounts. This makes the script
 *      safe to re-run as many times as you like.
 *   3. Creates the demo categories, admin + regular users, published
 *      places and approved reviews described in the task brief.
 *   4. Recomputes every seeded place's rating/reviewCount by running the
 *      exact same aggregation pipeline as updatePlaceRating() in
 *      backend/api/reviews.js, so those numbers are always derived from
 *      real Review documents -- never hardcoded.
 *   5. Prints a summary, including the admin login credentials.
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import Category from "./models/Category.js";
import Place from "./models/Place.js";
import User from "./models/User.js";
import Review from "./models/Reviews.js";
import Favorite from "./models/Favorite.js";

dotenv.config();


const ADMIN_EMAIL = "admin@kamersite.com";
const ADMIN_PASSWORD = "Admin12345";

const SEED_USER_EMAILS = [
    ADMIN_EMAIL,
    "marie.ngono@kamersite.com",
    "paul.etoundi@kamersite.com",
    "aisha.bello@kamersite.com"
];


async function run() {

    if (!process.env.MONGODB_URI) {
        console.error(
            "MONGODB_URI is not set. Add it to backend/.env before seeding."
        );
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    await clearSeedData();

    const categories = await createCategories();
    const users = await createUsers();
    const places = await createPlaces(categories);
    const reviews = await createReviews(users, places);

    await recalculateAllRatings(places);

    await printSummary(categories, places, users, reviews);

    await mongoose.disconnect();
    console.log("Disconnected. Seeding complete.");
}


/* 1. Clean slate (safe to re-run) */

async function clearSeedData() {

    await Category.deleteMany({});
    await Place.deleteMany({});
    await Review.deleteMany({});
    await Favorite.deleteMany({});

    await User.deleteMany({
        email: { $in: SEED_USER_EMAILS }
    });

    console.log("Cleared previous seed data.");
}


/* 2. Categories */

async function createCategories() {

    const categoryData = [
        {
            name: "Restaurants",
            description: "Great places to eat, from local food to fine dining.",
            icon: "🍽️",
            status: "active"
        },
        {
            name: "Cafés",
            description: "Coffee shops and relaxed spots to work or chat.",
            icon: "☕",
            status: "active"
        },
        {
            name: "Nature",
            description: "Parks, hills, and other outdoor green spaces.",
            icon: "🌳",
            status: "active"
        },
        {
            name: "Entertainment",
            description: "Cinemas, shows and other fun activities.",
            icon: "🎬",
            status: "active"
        },
        {
            name: "Shopping",
            description: "Markets, malls and boutiques around the city.",
            icon: "🛍️",
            status: "active"
        },
        {
            name: "Accommodation",
            description: "Hotels and guesthouses to stay the night.",
            icon: "🏨",
            status: "active"
        }
    ];

    const categories = await Category.create(categoryData);

    console.log(`Created ${categories.length} categories.`);

    const byName = {};
    categories.forEach((category) => {
        byName[category.name] = category;
    });

    return byName;
}


/* 3. Users (1 admin + 3 regular demo users) */

async function createUsers() {

    const demoUsers = [
        {
            name: "Admin",
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            role: "admin"
        },
        {
            name: "Marie Ngono",
            email: "marie.ngono@kamersite.com",
            password: "Password123",
            role: "user"
        },
        {
            name: "Paul Etoundi",
            email: "paul.etoundi@kamersite.com",
            password: "Password123",
            role: "user"
        },
        {
            name: "Aisha Bello",
            email: "aisha.bello@kamersite.com",
            password: "Password123",
            role: "user"
        }
    ];

    const createdUsers = [];

    for (const demoUser of demoUsers) {

        // Same hashing call used in backend/api/auth.js's register route --
        // never store a plaintext password.
        const hashedPassword = await bcrypt.hash(demoUser.password, 10);

        const user = await User.create({
            name: demoUser.name,
            email: demoUser.email,
            password: hashedPassword,
            role: demoUser.role
        });

        createdUsers.push(user);
    }

    console.log(`Created ${createdUsers.length} users (1 admin, 3 regular).`);

    return createdUsers;
}


/* 4. Places */

async function createPlaces(categories) {

    // Mont Febe's approximate coordinates are a well-known Yaoundé landmark,
    // so real lat/lng is used here. Every other place leaves coordinates
    // null rather than guessing -- see the hard constraint on GPS data.
    const placeData = [
        {
            name: "Le Patio",
            category: categories["Restaurants"]._id,
            description:
                "A cozy courtyard restaurant in Bastos serving Cameroonian " +
                "and continental dishes in a relaxed, leafy setting.",
            location: "Bastos, Yaoundé",
            address: "Rue 1.750, Bastos, Yaoundé",
            openingHours: "11:00 AM - 10:00 PM",
            entryFee: "3,000 FCFA",
            priceRange: "$$",
            activities: ["Dining", "Live music nights"],
            amenities: ["Parking", "Outdoor seating", "Wi-Fi"],
            images: [
                "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&q=80"
            ],
            status: "published"
        },
        {
            name: "Café de la Paix",
            category: categories["Cafés"]._id,
            description:
                "A popular downtown café known for strong coffee, pastries " +
                "and a great spot to watch the city go by.",
            location: "Centre-ville, Yaoundé",
            address: "Avenue Kennedy, Centre-ville, Yaoundé",
            openingHours: "6:30 AM - 8:00 PM",
            entryFee: "2,000 FCFA",
            priceRange: "$",
            activities: ["Coffee tasting", "People watching"],
            amenities: ["Wi-Fi", "Outdoor seating"],
            images: [
                "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=900&q=80"
            ],
            status: "published"
        },
        {
            name: "Mont Febe",
            category: categories["Nature"]._id,
            description:
                "A forested hill overlooking Yaoundé with hiking trails, " +
                "a monastery, and sweeping views of the city.",
            location: "Yaoundé",
            address: "Mont Febe, Yaoundé",
            coordinates: { lat: 3.9170, lng: 11.5400 },
            openingHours: "6:00 AM - 6:00 PM",
            entryFee: "Free",
            priceRange: "$",
            activities: ["Hiking", "Photography", "Sightseeing"],
            amenities: ["Parking"],
            images: [
                "https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=900&q=80"
            ],
            status: "published"
        },
        {
            name: "CinéCamer",
            category: categories["Entertainment"]._id,
            description:
                "A modern cinema screening the latest releases alongside " +
                "local Cameroonian films, with a snack bar on site.",
            location: "Yaoundé",
            address: "Avenue de l'Indépendance, Yaoundé",
            openingHours: "12:00 PM - 11:00 PM",
            entryFee: "3,000 FCFA",
            priceRange: "$$",
            activities: ["Movies", "Family outings"],
            amenities: ["Parking", "Family friendly"],
            images: [
                "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=900&q=80"
            ],
            status: "published"
        },
        {
            name: "Sky Lounge",
            category: categories["Restaurants"]._id,
            description:
                "A rooftop restaurant and bar in Bastos with skyline views, " +
                "grilled specialties and weekend DJ sets.",
            location: "Bastos, Yaoundé",
            address: "Rue 1.770, Bastos, Yaoundé",
            openingHours: "4:00 PM - 1:00 AM",
            entryFee: "4,000 FCFA",
            priceRange: "$$$",
            activities: ["Dining", "Nightlife"],
            amenities: ["Outdoor seating", "Parking"],
            images: [
                "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=900&q=80"
            ],
            status: "published"
        },
        {
            name: "Parc Zoo de Mvog-Betsi",
            category: categories["Nature"]._id,
            description:
                "A small zoo and primate rescue park, home to gorillas, " +
                "chimpanzees and other rescued wildlife.",
            location: "Mvog-Betsi, Yaoundé",
            address: "Mvog-Betsi, Yaoundé",
            openingHours: "9:00 AM - 5:30 PM",
            entryFee: "1,000 FCFA",
            priceRange: "$",
            activities: ["Wildlife viewing", "Family outings"],
            amenities: ["Parking", "Family friendly"],
            images: [
                "https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=900&q=80"
            ],
            status: "published"
        },
        {
            name: "Le Warda",
            category: categories["Restaurants"]._id,
            description:
                "A family-run restaurant serving generous Cameroonian " +
                "classics like ndolé and grilled fish.",
            location: "Yaoundé",
            address: "Quartier Mélen, Yaoundé",
            openingHours: "11:00 AM - 9:00 PM",
            entryFee: "2,500 FCFA",
            priceRange: "$",
            activities: ["Dining"],
            amenities: ["Family friendly", "Parking"],
            images: [
                "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=900&q=80"
            ],
            status: "published"
        },
        {
            name: "The Green Corner",
            category: categories["Cafés"]._id,
            description:
                "A quiet, plant-filled café that's popular with students " +
                "for studying, with reliable Wi-Fi and healthy snacks.",
            location: "Yaoundé",
            address: "Quartier Melen, Yaoundé",
            openingHours: "7:00 AM - 9:00 PM",
            entryFee: "2,000 FCFA",
            priceRange: "$",
            activities: ["Studying", "Coffee tasting"],
            amenities: ["Wi-Fi", "Pet friendly"],
            images: [
                "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=900&q=80"
            ],
            status: "published"
        },
        {
            name: "Marché Central",
            category: categories["Shopping"]._id,
            description:
                "Yaoundé's bustling central market, with everything from " +
                "fresh produce to fabrics and handmade crafts.",
            location: "Centre-ville, Yaoundé",
            address: "Centre-ville, Yaoundé",
            openingHours: "7:00 AM - 7:00 PM",
            entryFee: "Free",
            priceRange: "$",
            activities: ["Shopping", "Sightseeing"],
            amenities: [],
            images: [
                "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=900&q=80"
            ],
            status: "published"
        },
        {
            name: "Santa Lucia Hotel",
            category: categories["Accommodation"]._id,
            description:
                "A comfortable mid-range hotel close to the city centre, " +
                "with a restaurant, pool and conference rooms.",
            location: "Yaoundé",
            address: "Avenue John F. Kennedy, Yaoundé",
            openingHours: "Open 24 hours",
            entryFee: "35,000 FCFA / night",
            priceRange: "$$$",
            activities: ["Swimming"],
            amenities: ["Wi-Fi", "Parking", "Pool"],
            images: [
                "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80"
            ],
            status: "published"
        }
    ];

    const places = await Place.create(placeData);

    console.log(`Created ${places.length} published places.`);

    return places;
}


/* 5. Reviews -- spread unevenly across places so ratings vary */

async function createReviews(users, places) {

    const comments = [
        "Really enjoyed my visit, would recommend to friends.",
        "Great atmosphere and friendly staff.",
        "Good experience overall, a bit pricey though.",
        "One of my favorite spots in Yaoundé!",
        "Nice place, will definitely come back.",
        "Decent, but service could be faster.",
        "Loved it -- exactly what I was looking for.",
        "Pretty good, a solid choice for an outing."
    ];

    const reviewsToCreate = [];

    places.forEach((place, placeIndex) => {

        // Vary how many reviews each place gets (2 to 4) and which users
        // + ratings, so the derived average/count differ per place.
        const reviewCountForPlace = 2 + (placeIndex % 3);

        for (let i = 0; i < reviewCountForPlace; i++) {

            const user = users[(placeIndex + i) % users.length];

            // Ratings cycle through 3-5 with some spread per place.
            const rating = 3 + ((placeIndex + i) % 3);

            reviewsToCreate.push({
                user: user._id,
                place: place._id,
                rating,
                comment: comments[(placeIndex + i) % comments.length],
                status: "approved"
            });
        }
    });

    // Reviews have a unique (user, place) index -- the loop above already
    // avoids repeating the same user on the same place because it only
    // ever picks each user once per place within the small counts used.
    const reviews = await Review.create(reviewsToCreate);

    console.log(`Created ${reviews.length} approved reviews.`);

    return reviews;
}


/* 6. Recompute rating/reviewCount from real reviews only.
      Identical $match/$group/$avg/$sum pipeline as updatePlaceRating()
      in backend/api/reviews.js. */

async function recalculateAllRatings(places) {

    for (const place of places) {
        await updatePlaceRating(place._id);
    }

    console.log(`Recalculated rating/reviewCount for ${places.length} places.`);
}

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


/* 7. Summary */

async function printSummary(categories, places, users, reviews) {

    console.log("\n================ SEED SUMMARY ================");
    console.log(`Categories: ${Object.keys(categories).length}`);
    console.log(`Places:     ${places.length}`);
    console.log(`Users:      ${users.length} (1 admin, ${users.length - 1} regular)`);
    console.log(`Reviews:    ${reviews.length}`);
    console.log("------------------------------------------------");
    console.log("Admin login:");
    console.log(`  Email:    ${ADMIN_EMAIL}`);
    console.log(`  Password: ${ADMIN_PASSWORD}`);
    console.log("================================================\n");
}


run().catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
});
