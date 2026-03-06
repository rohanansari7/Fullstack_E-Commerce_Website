import express from "express"
import cors from "cors"
import cookieParsar from "cookie-parser"
import {config} from "dotenv"
import fileUpload from "express-fileupload"
import { createAllTables } from "./utils/createAllTables.js"
import { handleError} from './middlewares/errorMiddleware.js'
import authRoutes from "./routes/authRoutes.js"
import productRoutes from "./routes/productRoutes.js"
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

createAllTables();

app.use(handleError);

export default app;