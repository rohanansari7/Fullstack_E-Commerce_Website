import express from "express"
import { isAuthenticated, authorizeRoles } from "../middlewares/authMiddleware.js"
import { createProduct, fetchAllProducts, updateProduct, deleteProduct, singleProductDetails, sendProductReviews, deleteReviews } from "../controllers/products.js"


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
/**
 * @swagger
 * /api/v1/products/submit-review/{productId}:
 *   post:
 *     summary: Create or update a product review
 *     description: |
 *       Allows a logged-in user to submit or update a review for a product.
 *       User must have purchased the product (payment status must be 'Paid').
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         description: Product UUID
 *         schema:
 *           type: string
 *           format: uuid
 *         example: f37f36d3-8d09-41f1-a9bc-ac9ee508ea8f
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *               - comment
 *             properties:
 *               rating:
 *                 type: number
 *                 format: float
 *                 example: 4.5
 *               comment:
 *                 type: string
 *                 example: "Great product, worth the price!"
 *     responses:
 *       200:
 *         description: Review submitted or updated successfully
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
 *                   example: Review submitted successfully
 *                 review:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: 9c1f7b52-1234-4a2b-9abc-123456789abc
 *                     product_id:
 *                       type: string
 *                       format: uuid
 *                       example: f37f36d3-8d09-41f1-a9bc-ac9ee508ea8f
 *                     user_id:
 *                       type: string
 *                       format: uuid
 *                       example: a12b34c5-6789-4def-9012-abcdef123456
 *                     rating:
 *                       type: number
 *                       example: 4.5
 *                     comment:
 *                       type: string
 *                       example: Great product!
 *                 product:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: f37f36d3-8d09-41f1-a9bc-ac9ee508ea8f
 *                     ratings:
 *                       type: number
 *                       example: 4.2
 *       400:
 *         description: Missing required fields
 *       403:
 *         description: User has not purchased the product
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.post("/submit-review/:productId", isAuthenticated, sendProductReviews)
/**
 * @swagger
 * /api/v1/products/delete-review/{productId}:
 *   delete:
 *     summary: Delete review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: f37f36d3-8d09-41f1-a9bc-ac9ee508ea8f
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *       404:
 *         description: Review not found
 */
router.delete("/delete/review/:productId", isAuthenticated, deleteReviews)

export default router;