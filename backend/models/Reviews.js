import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        place: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Place",
            required: true
        },

        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },

        comment: {
            type: String,
            default: "",
            trim: true,
            maxlength: 1000
        },

        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending"
        }
    },
    {
        timestamps: true
    }
);

reviewSchema.index(
    { user: 1, place: 1 },
    { unique: true }
);

const Review = mongoose.model("Review", reviewSchema);

export default Review;