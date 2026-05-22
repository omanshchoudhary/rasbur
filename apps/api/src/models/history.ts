import mongoose, { Schema } from "mongoose";

export const decodeHistorySchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },

    originalInput: {
        type: String,
        required: true,
    },
    steps: [
        {
            decoderName: {
                type: String,
                required: true,
            },
            confidence: {
                type: Number,
                required: true,
            },
            input: {
                type: String,
                required: true,
            },
            output: {
                type: String,
                required: true,
            },
            explanation: {
                type: String,
                required: true,
            },
        }
    ],
    finalOutput: { type: String, required: true }
}, { timestamps: true })

export const DecodeHistory = mongoose.model('DecodeHistory', decodeHistorySchema)