import  ErrorHandler from "../middlewares/errorMiddleware.js"
import {catchAsyncError} from "../middlewares/catchAsyncError.js"
import databaseConnection from "../database/db.js"
import { v2 as cloudinary } from "cloudinary"
import { generatePaymentIntent } from "../utils/generatePaymentIntent.js";


export const createNewOrder = catchAsyncError(async (req, res, next) => {
    const {full_name, state, city, country, address, pincode, phone, orderedItems} = req.body;
    const userId = req.user.id;

    if(!full_name || !state || !city || !country || !address || !pincode || !phone) {
        return next(new ErrorHandler("Please Provide all the shipping details", 400));
    }

    const items = Array.isArray(orderedItems) ? orderedItems : JSON.parse(orderedItems);

    if(!items || items.length === 0) {
        return next(new ErrorHandler("No items to order", 400));
    }   

    const productIds = items.map((item) => item.product.id);

    const {rows: products} = await databaseConnection.query(
        `SELECT id, name, price, stock, images FROM products WHERE id = ANY($1::uuid[])`,
        [productIds]
    );

    let totalPrice = 0;
    const values = [];
    const placeholders = [];

    items.forEach((item, index) => {
        const product = products.find((p) => p.id === item.product.id);

        if (!product) {
            return next(new ErrorHandler(`Product with ID ${item.product.id} not found`, 404));
        }

        if(item.quantity > product.stock) {
            return next(new ErrorHandler(`Insufficient stock for product ${product.name}`, 400));
        }
        
        //totalPrice += product.price * item.quantity;
        const itemTotals = product.price * item.quantity;
        totalPrice += itemTotals;

        values.push(null, product.id, product.price, product.name, product.images[0]?.url || "", item.quantity);

        const offset = index * 6;

        placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`);
    });
    
    const shipping_price = total_price >= 50 ? 0 : 2;
    const tax_price = 0.18;

    totalPrice = Math.round( totalPrice + totalPrice * tax_price + shipping_price);

    const orderResult = await databaseConnection.query(`
        INSERT INTO orders (
        buyer_id,
        total_price,
        tax_price,
        shipping_price
        ) VALUES (
        $1, 
        $2, 
        $3, 
        $4
        ) RETURNING id
    `, [userId, totalPrice, tax_price, shipping_price]);

    const orderId = orderResult.rows[0].id;

    for( let i = 0; i < values.length; i += 6) {
        values[i] = orderId;
    }

    await databaseConnection.query(`
        INSERT INTO order_items (
        order_id,
        product_id,
        price,
        image,
        title,
        quantity
        ) VALUES
        ${placeholders.join(", ")} RETURNING *
        `, values
    );

    await databaseConnection.query(`
        INSERT INTO shipping_info (
        order_id,
        full_name,
        state,
        city,
        country,
        address,
        pincode,
        phone
        ) VALUES (
        $1, 
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8
        )
        `, [orderId, full_name, state, city, country, address, pincode, phone]
    );

    const paymentResponse = await generatePaymentIntent(orderId, total_price);

    if (!paymentResponse.success) {
        return next(new ErrorHandler( 500, paymentResponse.message));
    }

    res.status(201).json({
        success: true,
        message: "Order created successfully",
        clientSecret: paymentResponse.clientSecret,
        total_price
    });
});

export const getSingleOrder = catchAsyncError(async (req, res, next) => {
    const orderId = req.params.id;
    const userId = req.user.id;

    const orderQuery = `
        SELECT o.*,
        COALESCE(
        json_agg(
        json_build_object(
        'order_items.id', oi.id,
        'order_id', oi.order_id,
        'product_id', oi.product_id,
        'price', oi.price,
        'quantity', oi.quantity,
        'image', oi.image,
        'title', oi.title
        )
        ) FILTER ( WHERE oi.id IS NOT NULL), '[]'
        ) AS order_items,
        json_build_object(
        'full_name', si.full_name,
        'state', si.state,
        'city', si.city,
        'country', si.country,
        'address', si.address,
        'pincode', si.pincode,
        'phone', si.phone
        ) AS shipping_info
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN shipping_info si ON o.id = si.order_id
        WHERE o.id = $1 AND o.buyer_id = $2
        GROUP BY o.id, si.id
    `;

    const { rows } = await databaseConnection.query(orderQuery, [orderId, userId]);

    if (rows.length === 0) {
        return next(new ErrorHandler("Order not found", 404));
    }

    res.status(200).json({
        success: true,
        message: "Single Order fetched successfully",
        order: rows[0]
    });
});

export const getMyOrders = catchAsyncError(async (req, res, next) => {
    const userId = req.user.id;

    const myOrderQuery = `
    SELECT o.*,
     COALESCE(
        json_agg(
        json_build_object(
        'order_items.id', oi.id,
        'order_id', oi.order_id,
        'product_id', oi.product_id,
        'price', oi.price,
        'quantity', oi.quantity,
        'image', oi.image
        )
        ) FILTER ( WHERE oi.id IS NOT NULL), '[]'
     ) AS order_items,
        json_build_object(
        'full_name', si.full_name,
        'state', si.state,
        'city', si.city,
        'country', si.country,
        'address', si.address,
        'pincode', si.pincode,
        'phone', si.phone
        ) AS shipping_info
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN shipping_info si ON o.id = si.order_id
    WHERE o.buyer_id = $1 AND o.paid_at IS NOT NULL
    GROUP BY o.id, si.id
    ORDER BY o.created_at DESC
    `;

    const { rows } = await databaseConnection.query(myOrderQuery, [userId]);

    // if(rows.length === 0) {
    //     return next(new ErrorHandler("No orders found for this user", 404));
    // }

    res.status(200).json({
        success: true,
        message: "My Orders fetched successfully",
        orders: rows
    });
});

export const getAllOrders = catchAsyncError(async (req, res, next) => {
    const userId = req.user.id;

    const fetchAllOrdersQuery = `
        SELECT o.*,
        COALESCE(
        json_agg(
        json_build_object(
         'order_items.id', oi.id,
         'order_id', oi.order_id,
         'product_id', oi.product_id,
         'price', oi.price,
         'quantity', oi.quantity,
         'image', oi.image,
         'title', oi.title 
        )
        ) FILTER ( WHERE oi.id IS NOT NULL), '[]'
        ) AS order_items,
         json_build_object(
        'full_name', si.full_name,
        'state', si.state,
        'city', si.city,
        'country', si.country,
        'address', si.address,
        'pincode', si.pincode,
        'phone', si.phone
         ) AS shipping_info
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN shipping_info si ON o.id = si.order_id
        WHERE o.paid_at IS NOT NULL
        GROUP BY o.id, si.id
        ORDER BY o.created_at DESC
     `;

    const { rows } = await databaseConnection.query(fetchAllOrdersQuery);

    // if(rows.length === 0) {
    //     return next(new ErrorHandler("No orders found", 404));
    // }

    res.status(200).json({
        success: true,
        message: "All Orders fetched successfully",
        orders: rows
    });
});

export const updateOrderStatus = catchAsyncError(async (req, res, next) => {
    const orderId = req.params.id;
    const { status } = req.body;

    if(!status) {
        return next(new ErrorHandler("Please provide a status to update", 400));
    }

    const orderResult = await databaseConnection.query(`
        SELECT * FROM orders WHERE id = $1
        `, [orderId]);

    if(orderResult.rows.length === 0) {
        return next(new ErrorHandler("Order not found", 404));
    }

    const update = await databaseConnection.query(`
        UPDATE orders SET order_status = $1 AND id = $2 RETURNING *
        `, [status, orderId]);

    res.status(200).json({
        success: true,
        message: "Order status updated successfully",
        order: update.rows[0]
    });
});

export const deleteOrder = catchAsyncError(async (req, res, next) => {
    const orderId = req.params.id;

    const orderResult = await databaseConnection.query(`
        DELETE FROM orders WHERE id = $1 RETURNING *
        `, [orderId]);

    if(orderResult.rows.length === 0) {
        return next(new ErrorHandler("Order not found", 404));
    }

    res.status(200).json({
        success: true,
        message: "Order deleted successfully",
    });
});