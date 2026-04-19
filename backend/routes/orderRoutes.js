import express from 'express';
import { createNewOrder, getSingleOrder, getAllOrders, getMyOrders, deleteOrder, updateOrderStatus } from "../controllers/order.js";
import { isAuthenticated, authorizeRoles } from "../middlewares/authMiddleware.js"


const router = express.Router();

/**
 * @swagger
 * /api/v1/orders/new-order:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - full_name
 *               - state
 *               - city
 *               - country
 *               - address
 *               - pincode
 *               - phone
 *               - orderedItems
 *             properties:
 *               full_name:
 *                 type: string
 *                 example: "Rohan Ansari"
 *               state:
 *                 type: string
 *                 example: "Gujarat"
 *               city:
 *                 type: string
 *                 example: "Ahmedabad"
 *               country:
 *                 type: string
 *                 example: "India"
 *               address:
 *                 type: string
 *                 example: "123 Street Name"
 *               pincode:
 *                 type: string
 *                 example: "380001"
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               orderedItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                           example: f37f36d3-8d09-41f1-a9bc-ac9ee508ea8f
 *                     quantity:
 *                       type: integer
 *                       example: 2
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Order created successfully
 *               clientSecret: "pi_12345_secret_67890"
 *               total_price: 1500
 *       400:
 *         description: Validation error
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.post("/new-order", isAuthenticated, createNewOrder);
/**
 * @swagger
 * /api/v1/orders/single-order/{id}:
 *   get:
 *     summary: Get single order details
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Order ID (UUID)
 *         schema:
 *           type: string
 *           format: uuid
 *         example: a12b34c5-6789-4def-9012-abcdef123456
 *     responses:
 *       200:
 *         description: Order fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Single Order fetched successfully
 *               order:
 *                 id: a12b34c5-6789-4def-9012-abcdef123456
 *                 total_price: 1500
 *                 order_items:
 *                   - order_items.id: 1
 *                     order_id: a12b34c5-6789-4def-9012-abcdef123456
 *                     product_id: f37f36d3-8d09-41f1-a9bc-ac9ee508ea8f
 *                     price: 500
 *                     quantity: 2
 *                     image: "image-url"
 *                     title: "Product Name"
 *                 shipping_info:
 *                   full_name: "Rohan Ansari"
 *                   state: "Gujarat"
 *                   city: "Ahmedabad"
 *                   country: "India"
 *                   address: "123 Street"
 *                   pincode: "380001"
 *                   phone: "9876543210"
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
router.get("/single-order/:id", isAuthenticated, getSingleOrder);
/**
 * @swagger
 * /api/v1/orders/admin/my-order:
 *   get:
 *     summary: Get logged-in user's orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Orders fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: My Orders fetched successfully
 *               orders:
 *                 - id: a12b34c5-6789-4def-9012-abcdef123456
 *                   total_price: 1500
 *                   order_items:
 *                     - order_items.id: 1
 *                       order_id: a12b34c5-6789-4def-9012-abcdef123456
 *                       product_id: f37f36d3-8d09-41f1-a9bc-ac9ee508ea8f
 *                       price: 500
 *                       quantity: 2
 *                       image: "image-url"
 *                   shipping_info:
 *                     full_name: "Rohan Ansari"
 *                     state: "Gujarat"
 *                     city: "Ahmedabad"
 *                     country: "India"
 *                     address: "123 Street"
 *                     pincode: "380001"
 *                     phone: "9876543210"
 *       500:
 *         description: Internal server error
 */
router.get("/admin/my-order", isAuthenticated, getMyOrders);
/**
 * @swagger
 * /api/v1/orders/admin/fetch-all-order:
 *   get:
 *     summary: Get all orders (Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All orders fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: All Orders fetched successfully
 *               orders:
 *                 - id: a12b34c5-6789-4def-9012-abcdef123456
 *                   total_price: 1500
 *                   order_items:
 *                     - order_items.id: 1
 *                       order_id: a12b34c5-6789-4def-9012-abcdef123456
 *                       product_id: f37f36d3-8d09-41f1-a9bc-ac9ee508ea8f
 *                       price: 500
 *                       quantity: 2
 *                       image: "image-url"
 *                       title: "Product Name"
 *                   shipping_info:
 *                     full_name: "Rohan Ansari"
 *                     state: "Gujarat"
 *                     city: "Ahmedabad"
 *                     country: "India"
 *                     address: "123 Street"
 *                     pincode: "380001"
 *                     phone: "9876543210"
 *       500:
 *         description: Internal server error
 */
router.get("/admin/fetch-all-order", isAuthenticated, authorizeRoles("Admin"), getAllOrders);
/**
 * @swagger
 * /api/v1/orders/admin/delete-order/{id}:
 *   delete:
 *     summary: Delete an order (Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Order ID (UUID)
 *         schema:
 *           type: string
 *           format: uuid
 *         example: a12b34c5-6789-4def-9012-abcdef123456
 *     responses:
 *       200:
 *         description: Order deleted successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Order deleted successfully
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
router.delete("/admin/delete-order/:id", isAuthenticated, authorizeRoles("Admin"), deleteOrder);
/**
 * @swagger
 * /api/v1/orders/admin/update-order/{id}:
 *   put:
 *     summary: Update order status (Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Order ID (UUID)
 *         schema:
 *           type: string
 *           format: uuid
 *         example: a12b34c5-6789-4def-9012-abcdef123456
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 example: Shipped
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Order status updated successfully
 *               order: {}
 *       400:
 *         description: Status is required
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
router.put("/admin/update-order/:id", isAuthenticated, authorizeRoles("Admin"), updateOrderStatus);


export default router;