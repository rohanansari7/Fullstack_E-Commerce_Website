import { createUserTable } from "../models/user.js";
import { createOrderItemTable } from "../models/orderItemsTable.js";
import { createOrdersTable } from "../models/ordersTable.js";
import { createProductsTable } from "../models/productsTable.js";
import { createProductReviewsTable } from "../models/productReviewsTable.js";
import { createShippingTable } from "../models/shippinginfoTable.js";
import {createPaymentsTable} from "../models/paymentsTable.js";


export const createAllTables = async () => {
    try {
        await createUserTable();
        await createProductsTable();
        await createOrdersTable();
        await createOrderItemTable();
        await createShippingTable();
        await createProductReviewsTable();
        await createPaymentsTable();
        console.log("All tables created successfully.")
    } catch (error) {
        console.log("Error while creating All the tables", error)
        process.exit(1);
    }
}