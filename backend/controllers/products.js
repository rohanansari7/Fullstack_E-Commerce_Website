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
        [name, description, price , category, stock, JSON.stringify(uploadedImages), userId]
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

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";


    // get total filtered products count   
    const totalProductsResult = await databaseConnection.query(
        `SELECT COUNT(*) FROM products p ${whereClause}`,
        value
    );

    const totalProducts = parseInt(totalProductsResult.rows[0].count);   

    paginationPlaceholder.limit = `${index}`;
    value.push(limit);
    index++;

    paginationPlaceholder.offset = `${index}`;
    value.push(offset);
    index++;

    // Fetch Products with Reviews 
    const query = `
    SELECT 
        p.*, 
        COUNT(r.id) AS total_reviews
        FROM products p
        LEFT JOIN reviews r ON p.id = r.product_id
        ${whereClause}
        GROUP BY p.id
        ORDER BY p.created_at DESC
        LIMIT $${paginationPlaceholder.limit} 
        OFFSET $${paginationPlaceholder.offset}
    `

    const result = await databaseConnection.query(query, value);


    // Fetch New Products with Reviews in last 21 days
    const newProductsQuery = `
    SELECT 
        p.*, 
        COUNT(r.id) AS total_reviews
        FROM products p
        LEFT JOIN reviews r ON p.id = r.product_id
        WHERE p.created_at >= NOW() - INTERVAL '21 days'
        GROUP BY p.id
        ORDER BY p.created_at DESC
        LIMIT 9
    `

    const newProductsResult = await databaseConnection.query(newProductsQuery);

    // Fetch Top Rated Products with Reviews(rating >= 4)
    const topRatedProductsQuery = `
    SELECT 
        p.*,
        COUNT(r.id) AS total_reviews,
        AVG(r.rating) AS average_rating
        FROM products p
        LEFT JOIN reviews r ON p.id = r.product_id
        WHERE r.rating >= 4
        GROUP BY p.id
        ORDER BY average_rating DESC, total_reviews DESC, p.created_at DESC
        LIMIT 9
    `

    const topRatedProductsResult = await databaseConnection.query(topRatedProductsQuery);

    res.status(200).json({
        success: true,
        products: result.rows,
        totalProducts,
        currentPage: page,
        newProducts: newProductsResult.rows,
        topRatedProducts: topRatedProductsResult.rows,
    });
});

export const updateProduct = catchAsyncError(async (req, res, next) => {
    const { productId } = req.params;
    const { name, description, price, category, stock} = req.body;

    if(!name || !description || !price || !category || !stock) {
        return next(new ErrorHandler("Please provide all required fields", 400));
    }

    const productResult = await databaseConnection.query(
        `SELECT * FROM products WHERE id = $1`,
        [productId]
    );

    if(productResult.rows.length === 0) {
        return next(new ErrorHandler("Product not found", 404));
    }

    const updatedProduct = await databaseConnection.query(
        `UPDATE products SET 
            name = $1, 
            description = $2, 
            price = $3, 
            category = $4, 
            stock = $5,
            updated_at = NOW()
        WHERE id = $6
        RETURNING *`,
        [name, description, price / 283, category, stock, productId]
    );

    res.status(200).json({
        success: true,
        message: "Product updated successfully",
        product: updatedProduct.rows[0],
    });

});

export const deleteProduct = catchAsyncError(async (req, res, next) => {
    const { productId } = req.params;

    const productResult = await databaseConnection.query(
        `SELECT * FROM products WHERE id = $1`,
        [productId]
    );

    if(productResult.rows.length === 0) {
        return next(new ErrorHandler("Product not found", 404));
    }

    const images = productResult.rows[0].images;

   const deleteProductResult = await databaseConnection.query(
        `DELETE FROM products WHERE id = $1 RETURNING *`,
        [productId]
    );

    if(deleteProductResult.rows.length === 0) {
        return next(new ErrorHandler("Failed to delete product", 500));
    }

    if(images && images.length > 0) {
        for(const image of images) {
            await cloudinary.uploader.destroy(image.public_id);
        }
    };


    res.status(200).json({
        success: true,
        message: "Product deleted successfully",
        deletedProduct: deleteProductResult.rows[0],
    });
});

export const singleProductDetails = catchAsyncError(async (req, res, next) => {
    const { productId } = req.params;

    const productResult = await databaseConnection.query(
        `
        SELECT p.*,
        COALESCE(
        json_agg(
        json_build_object(
            'review_id', r.id,
            'rating', r.rating,
            'comment', r.comment,
            'reviewer', json_build_object(
                'id', u.id,
                'name', u.name,
                'avatar', u.avatar
            )
        )) FILTER (WHERE r.id IS NOT NULL), '[]') AS reviews
        FROM products p 
        LEFT JOIN reviews r ON p.id = r.product_id
        LEFT JOIN users u ON r.user_id = u.id
        WHERE p.id = $1
        GROUP BY p.id
        `,
        [productId]
    );

    if(productResult.rows.length === 0) {
        return next(new ErrorHandler("Product not found", 404));
    }

    res.status(200).json({
        success: true,
        product: productResult.rows[0],
    });
});

export const sendProductReviews = catchAsyncError(async (req, res, next) => {
    const { productId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    if(!rating || !comment) {
        return next(new ErrorHandler("Please provide all required fields", 400));
    }

    const purchaseCheckResult = `
        SELECT oi.product_id 
        FROM order_items oi
        LEFT JOIN orders o On o.id = oi.order_id
        LEFT JOIN payments P ON p.order_id = o.id
        WHERE oi.product_id = $1 AND o.buyer_id = $2 AND p.payment_status = 'Paid'
        LIMIT 1
        `;

        const { rows } = await databaseConnection.query(purchaseCheckResult, [productId, userId]);

        if(rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: "You can only review products you have purchased",
            });
            //return next(new ErrorHandler("You can only review products you have purchased", 403));
        }

        const product = await databaseConnection.query(
            `SELECT * FROM products WHERE id = $1`,
            [productId]
        );

        if(product.rows.length === 0) {
            return next(new ErrorHandler("Product not found", 404));
        }

        const alreadyReviewedResult = await databaseConnection.query(
            `SELECT * FROM reviews WHERE product_id = $1 AND user_id = $2`,
            [productId, userId]
        );

        // if(alreadyReviewedResult.rows.length > 0) {
        //     return res.status(400).json({
        //         success: false,
        //         message: "You have already reviewed this product",
        //     });
        // }

        let review;

        if(alreadyReviewedResult.rows.length > 0) {
            review = await databaseConnection.query(
                `UPDATE reviews SET rating = $1, comment = $2 WHERE product_id = $3 AND user_id = $4 RETURNING *`,
                [rating, comment, productId, userId]
            );
        } else {
             review = await databaseConnection.query(
                `INSERT INTO reviews (product_id, user_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *`,
                [productId, userId, rating, comment]
            );
        }
        
        const allReviewsResult = await databaseConnection.query(
            `SELECT AVG(rating) AS avg_rating FROM reviews WHERE product_id = $1`,
            [productId]
        );

        const avgRating = allReviewsResult.rows[0].avg_rating;

        const updateProduct = await databaseConnection.query(
            `UPDATE products SET ratings = $1 WHERE id = $2 RETURNING *`,
            [avgRating, productId]
        );

        res.status(200).json({
            success: true,
            message: "Review submitted successfully",
            review: review.rows[0],
            product : updateProduct.rows[0],
        });
     

});

export const deleteReviews = catchAsyncError(async (req, res, next) => {
    const { productId } = req.params;
    const userId = req.user.id;


    const reviewResult = await databaseConnection.query(
        `DELETE FROM reviews WHERE product_id = $1 AND user_id = $2 RETURNING *`,
        [productId, userId]
    );

    if(reviewResult.rows.length === 0) {
        return next(new ErrorHandler("Review not found", 404));
    }

    const allReviewsResult = await databaseConnection.query(
        `SELECT AVG(rating) AS avg_rating FROM reviews WHERE product_id = $1`,
        [productId]
    );

    const avgRating = allReviewsResult.rows[0].avg_rating || 0;

    const updateProduct = await databaseConnection.query(
        `UPDATE products SET ratings = $1 WHERE id = $2 RETURNING *`,
        [avgRating, productId]
    );

    res.status(200).json({
        success: true,
        message: "Review deleted successfully",
        deletedReview: reviewResult.rows[0],
        product : updateProduct.rows[0],
    });

});

export const fetchAiGeneratedProducts = catchAsyncError(async (req, res, next) => {
    const { userPrompt } = req.body;

    if(!userPrompt) {
        return next(new ErrorHandler("Please provide a prompt", 400));
    }

    const filteredProduct = (query) => {
        const stopWords = new Set([
            "the",
        "they",
        "them",
        "then",
        "I",
        "we",
        "you",
        "he",
        "she",
        "it",
        "is",
        "a",
        "an",
        "of",
        "and",
        "or",
        "to",
        "for",
        "from",
        "on",
        "who",
        "whom",
        "why",
        "when",
        "which",
        "with",
        "this",
        "that",
        "in",
        "at",
        "by",
        "be",
        "not",
        "was",
        "were",
        "has",
        "have",
        "had",
        "do",
        "does",
        "did",
        "so",
        "some",
        "any",
        "how",
        "can",
        "could",
        "should",
        "would",
        "there",
        "here",
        "just",
        "than",
        "because",
        "but",
        "its",
        "it's",
        "if",
        ".",
        ",",
        "!",
        "?",
        ">",
        "<",
        ";",
        "`",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        ])

        return query.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter((word) => !stopWords.has(word)).map((word) => `%${word}%`);

    }

    const keyWords = filteredProduct(userPrompt);

    if(keyWords.length === 0) {
        return next(new ErrorHandler("Please provide a more descriptive prompt", 400));
    }

    const query = `
    SELECT * FROM products
    WHERE name ILIKE ANY($1) OR description ILIKE ANY($1) OR category ILIKE ANY($1)
    lIMIT 50
    `;

    const result = await databaseConnection.query(query, [keyWords]);

    if(result.rows.length === 0) {
        return res.status(200).json({
            success: true,
            message: "No products found matching your prompt",
            products: [],
        });
    }  
    
    // AI Generated Product Logic
    const { success, products } = await getAIRecommendation(req, res, userPrompt, filteredProduct)

    res.status(200).json({
        success: success,
        message: "AI Generated Products are Below",
        products
    });
    
});