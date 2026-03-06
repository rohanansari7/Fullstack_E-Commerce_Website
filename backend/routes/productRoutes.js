import express from "express"
import { isAuthenticated, authorizeRoles } from "../middlewares/authMiddleware.js"
import { createProduct } from "../controllers/products.js"


const router = express.Router()

router.post("/create-product", isAuthenticated, createProduct)

export default router;