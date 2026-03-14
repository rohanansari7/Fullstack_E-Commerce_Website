import express from "express"
import { isAuthenticated, authorizeRoles } from "../middlewares/authMiddleware.js"
import { createProduct, fetchAllProducts, updateProduct, deleteProduct, singleProductDetails } from "../controllers/products.js"


const router = express.Router()

router.post("/admin/create-product", isAuthenticated, authorizeRoles("Admin"),  createProduct)
/**
 * @swagger
 * /api/v1/products/fetch-all-products:
 *   get:
 *     summary: Fetch all products
 *     description: Retrieve a list of products with filtering, searching, and pagination. Also returns new products and top rated products.
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search products by name or description
 *         example: shoes
 *
 *       - in: query
 *         name: availability
 *         schema:
 *           type: string
 *           enum: [in-stock, out-of-stock, limited-stock]
 *         description: Filter products by stock availability
 *         example: in-stock
 *
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter products by category
 *         example: footwear
 *
 *       - in: query
 *         name: price
 *         schema:
 *           type: string
 *         description: Filter products by price range (minPrice-maxPrice)
 *         example: 100-500
 *
 *       - in: query
 *         name: ratings
 *         schema:
 *           type: number
 *         description: Filter products with minimum rating
 *         example: 4
 *
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *         example: 1
 *
 *     responses:
 *       200:
 *         description: Products fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *
 *                 totalProducts:
 *                   type: integer
 *                   example: 120
 *
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: Nike Running Shoes
 *                       description:
 *                         type: string
 *                         example: Lightweight running shoes
 *                       price:
 *                         type: number
 *                         example: 2999
 *                       category:
 *                         type: string
 *                         example: footwear
 *                       stock:
 *                         type: integer
 *                         example: 50
 *                       total_reviews:
 *                         type: integer
 *                         example: 25
 *
 *                 newProducts:
 *                   type: array
 *                   description: Products created in the last 21 days
 *                   items:
 *                     type: object
 *
 *                 topRatedProducts:
 *                   type: array
 *                   description: Products with highest ratings
 *                   items:
 *                     type: object
 *
 *       500:
 *         description: Server error
 */
router.get("/fetch-all-products", fetchAllProducts)
/**
 * @swagger
 * /api/v1/products/admin/update-product/{productId}:
 *   put:
 *     summary: Update a product
 *     description: Update an existing product using the product ID.
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         description: The ID of the product to update
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - price
 *               - category
 *               - stock
 *             properties:
 *               name:
 *                 type: string
 *                 example: Nike Running Shoes
 *               description:
 *                 type: string
 *                 example: Lightweight running shoes for daily workouts
 *               price:
 *                 type: number
 *                 example: 2999
 *               category:
 *                 type: string
 *                 example: footwear
 *               stock:
 *                 type: integer
 *                 example: 50
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Product updated successfully
 *                 product:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: Nike Running Shoes
 *                     description:
 *                       type: string
 *                     price:
 *                       type: number
 *                     category:
 *                       type: string
 *                     stock:
 *                       type: integer
 *       404:
 *         description: Product not found
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
router.put("/admin/update-product/:productId", isAuthenticated, authorizeRoles("Admin"), updateProduct)
/**
 * @swagger
 * /api/v1/products/admin/delete-product/{productId}:
 *   delete:
 *     summary: Delete a product
 *     description: Delete an existing product using its product ID. The product images stored in Cloudinary will also be removed.
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         description: The ID of the product to delete
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Product deleted successfully
 *                 deletedProduct:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: Nike Running Shoes
 *                     description:
 *                       type: string
 *                       example: Lightweight running shoes for daily workouts
 *                     price:
 *                       type: number
 *                       example: 2999
 *                     category:
 *                       type: string
 *                       example: footwear
 *                     stock:
 *                       type: integer
 *                       example: 20
 *       404:
 *         description: Product not found
 *       500:
 *         description: Failed to delete product
 */
router.delete("/admin/delete-product/:productId", isAuthenticated, authorizeRoles("Admin"), deleteProduct)
/**
 * @swagger
 * /api/v1/products/single-product-details/{productId}:
 *   get:
 *     summary: Get single product details
 *     description: Retrieve a product by its ID along with all associated reviews and reviewer information.
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         description: The UUID of the product to retrieve
 *         schema:
 *           type: string
 *           format: uuid
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Product details fetched successfully
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.get("/single-product-details/:productId", singleProductDetails)

export default router;