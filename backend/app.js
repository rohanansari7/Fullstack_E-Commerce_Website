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
config({path: "./config/config.env"})

const app = express();

app.use(express.json());
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
        securituSchemes: {
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