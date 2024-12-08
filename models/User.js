const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    isPremium: {
        type: Boolean,
        default: false
    },
    tokens: {
        type: Number,
        default: 2  // Free users start with 2 tokens per week
    },
    tokenResetDate: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

// Reset tokens weekly for free users
userSchema.methods.resetTokensIfNeeded = async function() {
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    if (!this.isPremium && Date.now() - this.tokenResetDate > oneWeek) {
        this.tokens = 2;
        this.tokenResetDate = Date.now();
        await this.save();
    }
};

// Check if user has enough tokens for a song
userSchema.methods.hasEnoughTokens = function(songDurationInSeconds) {
    if (this.isPremium) return true;
    return this.tokens > 0;
};

// Deduct tokens based on song length
userSchema.methods.deductTokens = async function(songDurationInSeconds) {
    if (!this.isPremium) {
        this.tokens -= 1;
        await this.save();
    }
};

module.exports = mongoose.model('User', userSchema);
