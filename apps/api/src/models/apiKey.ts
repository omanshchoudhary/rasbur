import mongoose, { Schema } from 'mongoose';

const apiKeySchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },

        keyHash: {
            type: String,
            required: true,
            index: true,
            unique: true,
        },

        prefix: {
            type: String,
            required: true,
            index: true,
        },

        permissions: {
            type: [String],
            enum: ['decode', 'history', 'share', 'compare'],
            default: ['decode'],
        },

        rateLimit: {
            type: Number,
            default: 1000,
            min: 1,
        },

        expiresAt: {
            type: Date,
            default: null,
        },

        lastUsedAt: {
            type: Date,
            default: null,
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

export const ApiKey = mongoose.model('ApiKey', apiKeySchema);
