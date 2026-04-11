import  ErrorHandler from "../middlewares/errorMiddleware.js"
import {catchAsyncError} from "../middlewares/catchAsyncError.js"
import databaseConnection from "../database/db.js"
import { v2 as cloudinary } from "cloudinary"


export const getAllUsers = catchAsyncError(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * 10;

    const totalUserResult = await databaseConnection.query(`
        SELECT COUNT(*) FROM users WHERE role = $1
        `, ["User"])

    const totalUsers = parseInt(totalUserResult.rows[0].count);

    const userQuery = await databaseConnection.query(`
            SELECT * FROM users WHERE role = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3
        `, ["User", 10, offset]
    );
    
    res.status(200).json({
        success: true,
        users: userQuery.rows,
        totalUserCount: totalUsers,
        currentPage: page
    });
});

export const deleteUser = catchAsyncError(async (req, res, next) => {
    const {id} = req.params;

    const userQuery = await databaseConnection.query(`
        SELECT * FROM users WHERE id = $1
    `, [id]);

    if(userQuery.rows.length === 0){
        return next(new ErrorHandler("User not found", 404))
    }

    const deleteUser = await databaseConnection.query(`
        DELETE FROM users WHERE id = $1 RETURNING *
    `, [id]);

    if(deleteUser.rows.length === 0){
        return next(new ErrorHandler("Failed to delete user", 500))
    }

    const deleteUserAvatar = deleteUser.rows[0].avatar;
    if(deleteUserAvatar){
        await cloudinary.uploader.destroy(deleteUserAvatar.public_id);
    }

    res.status(200).json({
        success: true,
        message: "User deleted successfully"
    });
});

export const dashboardStats = catchAsyncError(async (req, res, next) => {
    const today = new Date();
    const todayDate = today.toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split('T')[0]; // Get yesterday's date in YYYY-MM-DD format

    //Months Start
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Previous Month Start
    const previousMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const previousMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    // Total Revenue of ALl time
    const totalRevenueResult = await databaseConnection.query(`
        SELECT SUM(total_price) FROM orders WHERE paid_at IS NOT NULL
        `);
        
    const totalRevenue = parseFloat(totalRevenueResult.rows[0].sum) || 0;

    // Total Users of All time
    const totalUserQuery = await databaseConnection.query(`
        SELECT COUNT(*) FROM users WHERE role = 'User'
        `);
    
    const totalUsers = parseFloat(totalUserQuery.rows[0].count) || 0;;

    // Order Staus Count
    const orderStatusQuery = await databaseConnection.query(`
        SELECT order_status, COUNT(*) FROM orders WHERE paid_at IS NOT NULL GROUP BY order_status
        `);

    const orderStatus = {
        Processing: 0, 
        Shipped: 0, 
        Delivered: 0, 
        Cancelled: 0
    }
    
    orderStatusQuery.rows.forEach((row) =>{
        orderStatus[row.order_status] = parseInt(row.count);
    });

    // Revenue of Today
    const totalRevenueTodayResult = await databaseConnection.query(`
        SELECT SUM(total_price) FROM orders WHERE paid_at IS NOT NULL AND DATE(paid_at) = $1
        `, [todayDate]);
    
    const totalRevenueToday = parseFloat(totalRevenueTodayResult.rows[0].sum) || 0;

    // Revenue of Yesterday
    const totalRevenueYesterdayResult = await databaseConnection.query(`
        SELECT SUM(total_price) FROM orders WHERE paid_at IS NOT NULL AND DATE(paid_at) = $1
        `, [yesterdayDate]);

    const totalRevenueYesterday = parseFloat(totalRevenueYesterdayResult.rows[0].sum) || 0;


    // MOnthly sales for Line Chart
    const monthlySalesQuery = await databaseConnection.query(`
        SELECT 
        TO_CHAR(created_at, 'Mon YYYY') AS month,
        SUM(total_price) AS total_sales,
        COUNT(*) AS total_orders,
        AVG(total_price) AS average_order_value,
        DATE_TRUNC('month', created_at) AS date
        FROM orders WHERE paid_at IS NOT NULL
        GROUP BY month, date
        ORDER BY date
    `);
    
    const monthlySales = monthlySalesQuery.rows.map((row) => ({
        month: row.month,
        total_sales: parseFloat(row.total_sales) || 0,
        total_orders: parseInt(row.total_orders) || 0,
        average_order_value: parseFloat(row.average_order_value) || 0
    }))

    // Top 5 most Selling Products
    const topProductSellingQuery = await databaseConnection.query(`
        SELECT 
        p.name,
        p.ratings,
        p.category,
        p.images->0->>'url' AS image,
        SUM(oi.quantity) AS total_quantity_sold
        FROM order_items oi
        INNER JOIN products p ON p.id = oi.product_id
        INNER JOIN orders o ON o.id = oi.order_id
        WHERE o.paid_at IS NOT NULL
        GROUP BY p.name, p.ratings, p.category, p.images
        ORDER BY total_quantity_sold DESC
        LIMIT 5
        `);

    const topSellingProducts = topProductSellingQuery.rows;

    // Total Sales of Current Month
    const currentMonthSalesQuery = await databaseConnection.query(`
        SELECT SUM(total_price) AS total
        FROM orders WHERE paid_at IS NOT NULL AND created_at BETWEEN $1 AND $2
        `, [currentMonthStart, currentMonthEnd]);

    const currentMonthSales = parseFloat(currentMonthSalesQuery.rows[0].total) || 0;

    // Total Revenue of Previous Month
    const previousMonthRevenueQuery = await databaseConnection.query(`
        SELECT SUM(total_price) AS total
        FROM orders WHERE paid_at IS NOT NULL AND created_at BETWEEN $1 AND $2
        `, [previousMonthStart, previousMonthEnd]);

    const previousMonthRevenue = parseFloat(previousMonthRevenueQuery.rows[0].total) || 0;

    // Products with Low Stock (less than 5)
    const lowStockProductsQuery = await databaseConnection.query(`
        SELECT name, stock FROM products WHERE stock <= 5 
        `);

    const lowStockProducts = lowStockProductsQuery.rows;

    let revenueGrowth = "0%";

    if(previousMonthRevenue > 0){
        const growthRate = ((currentMonthSales - previousMonthRevenue) / previousMonthRevenue) * 100;
        revenueGrowth = `$(growthRate > 0 ? "+" : "")${growthRate.toFixed(2)}%`;
    }

    // New User Growth Rate
    const newUserCurrentMonthQuery = await databaseConnection.query(`
        SELECT COUNT(*) FROM users WHERE role = 'User' AND created_at >= $1        
        `, [currentMonthStart]);

    const newUserCurrentMonth = parseInt(newUserCurrentMonthQuery.rows[0].count) || 0;  

    const newUserPreviousMonthQuery = await databaseConnection.query(`
        SELECT COUNT(*) FROM users WHERE role = 'User' AND created_at BETWEEN $1 AND $2
        `, [ previousMonthStart, previousMonthEnd]);
    
    const newUserPreviousMonth = parseInt(newUserPreviousMonthQuery.rows[0].count) || 0;

    // Final Response
    res.status(200).json({
        success: true,
        totalRevenue,
        totalUsers,
        orderStatus,
        totalRevenueToday,
        totalRevenueYesterday,
        monthlySales,
        topSellingProducts,
        currentMonthSales,
        previousMonthRevenue,
        revenueGrowth,
        lowStockProducts,
        newUserCurrentMonth,
        newUserPreviousMonth,
        newUserGrowthRate: newUserPreviousMonth > 0 ? `$(newUserCurrentMonth - newUserPreviousMonth) / newUserPreviousMonth * 100` : "0%"
    });
});