import JWT from "jsonwebtoken"
import  ErrorHandler from "../middlewares/errorMiddleware.js"
import {catchAsyncError} from "../middlewares/catchAsyncError.js"
import databaseConnection from "../database/db.js"


export const isAuthenticated = catchAsyncError(async (req, res, next) => {
    const {token} = req.cookies;

    if(!token){
        return next(new ErrorHandler(401, "Please login to access this resource"))
    }

    const decoded = JWT.verify(token, process.env.JWT_SECRET_KEY);

    const userQuery = "SELECT * FROM users WHERE id = $1"
    const userResult = await databaseConnection.query(userQuery, [decoded.id])

    req.user = userResult.rows[0]
    next()
});


export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(
                new ErrorHandler(
                    403,
                    `Role: ${req.user.role} is not allowed to access this resource`
                )
            );
        }
        next();
    };
};
