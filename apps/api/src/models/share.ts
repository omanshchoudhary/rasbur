import mongoose, { Schema } from "mongoose";

export const shareSchema = new Schema({
    slug: {
        type: String,
        unique: true,
        required: true
    },
    historyId: {
        type: Schema.Types.ObjectId,
        ref: "DecodeHistory",
        required: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    expiresAt: { type: Date, required: true },
    viewCount: { type: Number, default: 0 }
}, {timestamps: true})

export const Share = mongoose.model('Share', shareSchema);