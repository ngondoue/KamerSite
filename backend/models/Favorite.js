import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema(
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
        }
    },
    {
        timestamps: true
    }
);

favoriteSchema.index(
    { user: 1, place: 1 },
    { unique: true }
);

const Favorite = mongoose.model("Favorite", favoriteSchema);

export default Favorite;