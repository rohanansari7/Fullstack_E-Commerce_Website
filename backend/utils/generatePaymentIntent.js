import databaseConnection from "../database/db.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function generatePaymentIntent(amount, currency, orderId, total_price) {
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: total_price * 100, // Convert to cents
            currency: 'usd',
        });

        // Store the payment intent details in the database
        await databaseConnection.query(`
            INSERT INTO payments (
                order_id, 
                payment_type, 
                payment_status, 
                payment_intent_id) 
                VALUES (
                $1, 
                $2, 
                $3, 
                $4)
            `, [orderId, 'Online', 'Pending', paymentIntent.client_secret]);

            return { success: true, clientSecret: paymentIntent.client_secret };
    } catch (error) {
    console.error("Payment Error:", error.message || error);
    return { success: false, message: "Payment Failed." };
    }
}