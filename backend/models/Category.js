import mongoose from "mongoose";
import slugify from "slugify";

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        slug: {
            type: String,
            unique: true,
            lowercase: true
        },

        description: {
            type: String,
            default: ""
        },

        image: {
            type: String,
            default: ""
        },

        icon: {
            type: String,
            default: ""
        },

        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active"
        }
    },
    {
        timestamps: true
    }
);


// Mongoose 7+ dropped callback-style ("next") middleware -- a hook
// either runs synchronously with no argument, or returns/awaits a
// promise. Declaring a "next" parameter here would leave it undefined.
categorySchema.pre("validate", function () {
    if (this.isModified("name") || !this.slug) {
        this.slug = slugify(this.name, {
            lower: true,
            strict: true
        });
    }
});


const Category = mongoose.model("Category", categorySchema);

export default Category;