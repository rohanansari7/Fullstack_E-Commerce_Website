import databaseConnection from "../database/db.js";
import Stripe from "stripe";


const stripe = Stripe("sk_test_51OvwyjSIDgmpKWon1fuxeau8poRUV8vOEWuDnKxNjp8cXNmLID4GRkbjPokvh8YhRH4rpiFVf2ONRuhzYYHl0Sbr00IzUALaqU");

export async function generatePaymentIntent(orderId, total_price) {    
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
            `, [orderId, 'Online', 'Pending', paymentIntent.id]);

            return { success: true, clientSecret: paymentIntent.client_secret };
    } catch (error) {
    console.error("Payment Error:", error.message || error);
    return { success: false, message: "Payment Failed." };
    }
}