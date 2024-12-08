const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const auth = require('../middleware/auth');
const User = require('../models/User');

// Get user's token balance
router.get('/balance', auth, async (req, res) => {
    try {
        await req.user.resetTokensIfNeeded();
        res.json({ 
            tokens: req.user.tokens,
            isPremium: req.user.isPremium,
            nextResetDate: new Date(req.user.tokenResetDate.getTime() + 7 * 24 * 60 * 60 * 1000)
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Purchase tokens or premium
router.post('/purchase', auth, async (req, res) => {
    try {
        const { paymentMethodId, amount, type } = req.body;
        
        // Create payment intent with Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100, // Convert to cents
            currency: 'usd',
            payment_method: paymentMethodId,
            confirm: true
        });

        if (paymentIntent.status === 'succeeded') {
            if (type === 'premium') {
                req.user.isPremium = true;
            } else {
                // Add tokens based on amount paid
                const tokenAmount = Math.floor(amount / 0.5) * 5; // $0.50 for 5 tokens
                req.user.tokens += tokenAmount;
            }
            await req.user.save();
            
            res.json({ 
                success: true, 
                tokens: req.user.tokens,
                isPremium: req.user.isPremium
            });
        } else {
            res.status(400).json({ error: 'Payment failed' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
