import express from "express"
import { getAllUsers, deleteUser, dashboardStats } from "../controllers/adminCtrl.js"
import { isAuthenticated, authorizeRoles, } from "../middlewares/authMiddleware.js"


const router = express.Router()
/**
 * @swagger
 * /api/v1/admin/dashboard-stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Admin-Dashboard-Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               totalRevenue: 50000
 *               totalUsers: 120
 *               orderStatus:
 *                 Processing: 10
 *                 Shipped: 20
 *                 Delivered: 80
 *                 Cancelled: 5
 *               totalRevenueToday: 2000
 *               totalRevenueYesterday: 1500
 *               monthlySales:
 *                 - month: "Jan 2026"
 *                   total_sales: 10000
 *                   total_orders: 50
 *                   average_order_value: 200
 *               topSellingProducts: []
 *               currentMonthSales: 15000
 *               previousMonthRevenue: 12000
 *               revenueGrowth: "+25%"
 *               lowStockProducts:
 *                 - name: "Product A"
 *                   stock: 3
 *               newUserCurrentMonth: 20
 *               newUserPreviousMonth: 15
 *               newUserGrowthRate: "+33%"
 *       500:
 *         description: Internal server error
 */
router.get("/dashboard-stats", isAuthenticated, authorizeRoles("Admin"), dashboardStats)

/**
 * @swagger
 * /api/v1/admin/all-users:
 *   get:
 *     summary: Get all users (paginated)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         description: Page number
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: List of users fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               users: []
 *               totalUserCount: 100
 *               currentPage: 1
 *       500:
 *         description: Internal server error
 */
router.get("/all-users", isAuthenticated, authorizeRoles("Admin"), getAllUsers)
/**
 * @swagger
 * /api/v1/admin/user/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User ID (UUID)
 *         schema:
 *           type: string
 *           format: uuid
 *         example: a12b34c5-6789-4def-9012-abcdef123456
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: User deleted successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to delete user
 */
router.delete("/delete-user/:id", isAuthenticated, authorizeRoles("Admin"), deleteUser)

export default router

