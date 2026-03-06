import  ErrorHandler from "../middlewares/errorMiddleware.js"
import {catchAsyncError} from "../middlewares/catchAsyncError.js"
import databaseConnection from "../database/db.js"
import {v2 as cloudinary} from "cloudinary"

export const createProduct = catchAsyncError(async (req, res, next) => {
    const { name, description, price, category, stock} = req.body;
    const userId = req.user.id;

    if (!name || !description || !price || !category || !stock) {
        return next(new ErrorHandler("Please provide all required fields", 400));
    }

    let uploadedImages = [];

    if (req.files && req.files.images) {
        const images = Array.isArray(req.files.images) ? req.files.images : [req.files.images];

        for (const image of images) {
            const result = await cloudinary.uploader.upload(image.tempFilePath, {
                folder: "products",
                width: 1000,
                crop: "scale",
            });
            uploadedImages.push({
                public_id: result.public_id,
                url: result.secure_url,
            });
        }
    };

    const productInsert = await databaseConnection.query(
        `INSERT INTO products (
                name, 
                description, 
                price, 
                category, 
                stock, 
                images, 
                created_by
                ) 
            VALUES (
                $1, 
                $2, 
                $3, 
                $4, 
                $5, 
                $6, 
                $7) 
                RETURNING *`,
        [name, description, price / 87, category, stock, JSON.stringify(uploadedImages), userId]
    );

    const newProduct = productInsert.rows[0];

    res.status(201).json({
        success: true,
        message: "Product created successfully",
        product: newProduct,
    });
});


export const fetchAllProducts = catchAsyncError(async (req, res, next) => {
    const { search, availability, category, price, ratings } = req.query;
    const page = parseInt(req.query.page) || 1; 
    const limit = 10;
    const offset = (page - 1) * limit;

    const conditions = [];
    const value = [];
    let index = 1;

    let paginationPlaceholder = {};

    if(availability === "in-stock") {
        conditions.push(`stock > 5`);
    } else if(availability === "out-of-stock") {
        conditions.push(`stock = 0`);
    } else if(availability === "limited-stock") {
        conditions.push(`stock > 0 AND stock <= 5`);
    }

    if(price) {
        const {minPrice, maxPrice} = price.split("-");
        if(minPrice && maxPrice) {
            conditions.push(`price BETWEEN $${index} AND  $${index + 1}`);
            value.push(minPrice, maxPrice);
            index += 2;
        }
    }

    if(category) {
        conditions.push(`category ILIKE $${index}`);
        value.push(`%${category}%`);
        index++;
    }

    if(ratings) {
        conditions.push(`ratings >= $${index}`);
        value.push(ratings);
        index++;
    }

    if(search) {
        conditions.push(`(p.name ILIKE $${index} OR p.description ILIKE $${index})`);
        value.push(`%${search}%`);
        index++;
    }
});