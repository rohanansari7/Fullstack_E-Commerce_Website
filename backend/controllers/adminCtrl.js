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

export const getAllProducts = catchAsyncError(async (req, res, next) => {});

export const deleteProduct = catchAsyncError(async (req, res, next) => {});

export const getAllOrders = catchAsyncError(async (req, res, next) => {});

export const updateOrderStatus = catchAsyncError(async (req, res, next) => {});