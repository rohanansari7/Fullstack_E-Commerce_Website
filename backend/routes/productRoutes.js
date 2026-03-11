import express from "express"
import { isAuthenticated, authorizeRoles } from "../middlewares/authMiddleware.js"
import { createProduct, fetchAllProducts } from "../controllers/products.js"


const router = express.Router()

router.post("/admin/create-product", isAuthenticated, authorizeRoles("admin"), createProduct)
router.get("/fetch-all-products", fetchAllProducts)

export default router;