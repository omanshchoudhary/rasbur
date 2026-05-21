import mongoose, { Schema } from 'mongoose';

export const userSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            unique: true,
            index: true,
        },
        avatar: { type: String },
        oauthProvider: { type: String, required: true },
        oauthId: { type: String, required: true, index: true },
        isActive: { type: Boolean, default: true },
        tier: { type: String, enum: ['free', 'pro'], default: 'free' },
        roles: { type: [String], default: [] },
        dailyDecodeCount: { type: Number, default: 0 },
        lastDecodeReset: { type: Date, default: () => new Date() },
    },
    {
        timestamps: { createdAt: true, updatedAt: true },
    }
);

export const User = mongoose.model('User', userSchema);
