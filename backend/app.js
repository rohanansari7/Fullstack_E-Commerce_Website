import express from "express"
import cors from "cors"
import cookieParsar from "cookie-parser"
import {config} from "dotenv"
import fileUpload from "express-fileupload"
import { createAllTables } from "./utils/createAllTables.js"
import { handleError} from './middlewares/errorMiddleware.js'
import authRoutes from "./routes/authRoutes.js"
import productRoutes from "./routes/productRoutes.js"
import adminRoutes from "./routes/adminRoutes.js"
import swaggerUi from "swagger-ui-express"
import swaggerJsdocs from "swagger-jsdoc"
import Stripe from "stripe"
import databaseConnection from "./database/db.js"
config({path: "./config/config.env"})

const app = express();

app.use(express.json());
app.post("/api/v1/webhook", express.raw({type: "application/json"}), async (req, res) =>{
    const sing = req.headers["stripe-signature"];
    let event;
    try {
        event = Stripe.webhooks.constructEvent(req.body, sing, process.env.STRIPE_WEBHOOK_SECRET);
        console.log("Webhook received:", event.type);
    } catch (error) {
        return res.status(400).send(`Webhook Error: ${error.message || error}`);
    }

    // Handle the event
    if(event.type === "payment_intent.succeeded"){
        const paymentIntent_client_secret = event.data.object.client_secret;
        console.log("Payment Intent Succeeded:", paymentIntent_client_secret);
        try {
            // Find the order associated with this payment intent and update its status to "paid"
            const updatePaymentStatus = 'Paid';
            const updatePaymentQuery = await databaseConnection.query(`
                UPDATE payments SET payment_status = $1 WHERE payment_intent_id = $2 RETURNING *
                `, [updatePaymentStatus, paymentIntent_client_secret]
            );
            console.log("Payment status updated in database:", updatePaymentQuery.rows[0]);
            const orderId = updatePaymentQuery.rows[0].order_id;

            // Update the order status to "paid"
            await databaseConnection.query(`
                UPDATE orders SET paid_at = Now() WHERE id = $1 RETURNING *
            `, [orderId]
            );
            console.log("Order status updated to paid for order ID:", orderId);

            const {rows: orderedItems} = await databaseConnection.query(`
                SELECT product_id, quantity FROM order_items WHERE order_id = $1
            `, [orderId]
            );

              // For each ordered item, reduce the product stock by the quantity orderedz
              for (const item of orderedItems) {
                await databaseConnection.query(`
                    UPDATE products SET stock = stock - $1 WHERE id = $2
                `, [item.quantity, item.product_id])
            }
        } catch (error) {
            return res.status(500).send(`Error updating paid_at timestamp in orders table. Error: ${error.message || error}`);
        }
    }

        res.status(200).send({ received: true });
})

app.use(cookieParsar());
app.use(express.urlencoded({ extended: true }))
app.use(cors({
    origin: [process.env.FRONTEND_URL, process.env.DASHBOARD_URL],
    methods: ['GET', 'POST', 'DELETE', 'PUT'],
    credentials: true
}));

app.use(fileUpload({
    tempFileDir: './temp',
    useTempFiles: true
}))

app.use("/api/v1/auth", authRoutes)
app.use("/api/v1/products", productRoutes)
app.use("/api/v1/admin", adminRoutes)

createAllTables();

// Swagger Configuration here!!
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "E-Commerce API",
            version: "1.0.0",
            description: "API documentation for E-Commerce application",
        },

        servers: [{url: "http://localhost:4000"}], // Swagger UI will use this as the base URL for API requests        
    },
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerAuthFormat: "JWT",
            },
        }, 
    },
    security: [
        {
        bearerAuth: [], // Apply bearerAuth globally to all endpoints
        }
    ],
    apis: ["./routes/*.js", "./controllers/*.js"], // Ensure this points to the correct route files

};

const swagggerSepcs = swaggerJsdocs(options);
app.get("/api-docs/json", (req, res) =>{
    console.log(swagggerSepcs);
    res.json(swagggerSepcs);
})
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swagggerSepcs));

app.use(handleError);

export default app;