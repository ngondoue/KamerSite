import mongoose from "mongoose";
import slugify from "slugify";

const placeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        slug: {
            type: String,
            unique: true,
            lowercase: true
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true
        },

        location: {
            type: String,
            required: true,
            trim: true
        },

        address: {
            type: String,
            default: ""
        },

        coordinates: {
            lat: {
                type: Number,
                default: null
            },
            lng: {
                type: Number,
                default: null
            }
        },

        openingHours: {
            type: String,
            default: ""
        },

        entryFee: {
            type: String,
            default: "Free"
        },

        priceRange: {
            type: String,
            enum: ["$", "$$", "$$$", "$$$$"],
            default: "$"
        },

        activities: {
            type: [String],
            default: []
        },

        amenities: {
            type: [String],
            default: []
        },

        contact: {
            phone: {
                type: String,
                default: ""
            },
            website: {
                type: String,
                default: ""
            }
        },

        images: {
            type: [String],
            default: []
        },

        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },

        reviewCount: {
            type: Number,
            default: 0
        },

        verification: {
            verified: {
                type: Boolean,
                default: false
            },
            verifiedAt: {
                type: Date,
                default: null
            },
            verifiedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                default: null
            }
        },

        status: {
            type: String,
            enum: ["draft", "published", "archived"],
            default: "draft"
        }
    },
    {
        timestamps: true
    }
);


// Create slug from place name
placeSchema.pre("validate", async function (next) {
    if (this.isModified("name") || !this.slug) {
        const baseSlug = slugify(this.name, {
            lower: true,
            strict: true
        });

        let slug = baseSlug;
        let number = 1;

        while (
            await mongoose.models.Place.exists({
                slug,
                _id: { $ne: this._id }
            })
        ) {
            number++;
            slug = `${baseSlug}-${number}`;
        }

        this.slug = slug;
    }

    next();
});


placeSchema.index({
    name: "text",
    description: "text",
    location: "text"
});


const Place = mongoose.model("Place", placeSchema);

export default Place;