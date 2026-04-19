import databaseConnection from "../database/db.js";

export async function createPaymentsTable() {
    try {
        const paymentQuery = `
        CREATE TABLE IF NOT EXISTS payments (         
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,         
                order_id UUID NOT NULL UNIQUE,         
                payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('Online')),         
                payment_status VARCHAR(20) NOT NULL CHECK (payment_status IN ('Paid', 'Pending', 'Failed')),         
                payment_intent_id VARCHAR(255) UNIQUE,         
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,         
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE       
                );
        `
        
        await databaseConnection.query(paymentQuery);
    } catch (error) {
        console.log("Error while creating Payments Table.", error)
        process.exit(1);
    }
}