import  ErrorHandler from "../middlewares/errorMiddleware.js"
import {catchAsyncError} from "../middlewares/catchAsyncError.js"
import databaseConnection from "../database/db.js"
import bcrypt from "bcrypt"
import { sendToken } from "../utils/jwt.js";
import { generateResetPasswordToken } from "../utils/resetPasswordToken.js"
import { resetPasswordMainTemp } from "../utils/resetPasswordMainTemp.js"
import {sendEmail} from "../utils/sendMails.js";
import crypto from "crypto"
import {v2 as cloudinary} from "cloudinary"
//import bcrtypt from "bcryptjs"

export const register = catchAsyncError(async (req, res, next) => {
    try {
        const {name, email, password} = req.body;

        if(!name || !email || !password){
            return next(new ErrorHandler("Please fill all the fields", 400))
        }

        if(password.length < 6 || password.length > 16){
            return next(new ErrorHandler("Password must be between 6 and 16 characters", 400))
        }

        const existingUserQuery = "SELECT * FROM users WHERE email = $1"
        const existingUserResult = await databaseConnection.query(existingUserQuery, [email])

        if(existingUserResult.rows.length > 0){ 
            return next(new ErrorHandler("User already exists with this email", 400))
        }

        const saltRounds = 10
        const hashedPassword = await bcrypt.hash(password, saltRounds)  

        const insertUserQuery = "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *"
        const insertUserResult = await databaseConnection.query(insertUserQuery, [name, email, hashedPassword])

        const newUser = insertUserResult.rows[0]

        // res.status(201).json({
        //     success: true,
        //     message: "User registered successfully",
        //     user: { 
        //         id: newUser.id,
        //         name: newUser.name,
        //         email: newUser.email
        //     }
        // })

        sendToken(newUser, 201, "User registered successfully", res)

    } catch (error) {
        console.log("Error in user registration", error)
        return next(new ErrorHandler("Error in user registration", 500))
    }
});

export const login = catchAsyncError(async( req, res, next) =>{
    try {
        const {email, password} = req.body;

        if(!email || !password){
            return next(new ErrorHandler("Please fill all the fields", 400))
        }

        const userQuery = "SELECT * FROM users WHERE email = $1"
        const userResult = await databaseConnection.query(userQuery, [email])

        if(userResult.rows.length === 0){
            return next(new ErrorHandler("Invalid email or password", 401))
        }

        const user = userResult.rows[0]

        const isPasswordMatch = await bcrypt.compare(password, user.password)

        if(!isPasswordMatch){
            return next(new ErrorHandler("Invalid email or password", 401))
        }

        sendToken(user, 200, "User logged in successfully", res)
    } catch (error) {
        console.log("Error in user login", error)
        return next(new ErrorHandler("Error in user login", 500))
    }
});

export const logout = catchAsyncError(async (req, res, next) =>{
    res.status(200).cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
    }).json({
        success: true,
        message: "User Logged out successfully"
    })
});

export const getUser = catchAsyncError(async (req, res, next) =>{
    const user = req.user;
    
    res.status(200).json({
        success: true,
        message: "User details fetched successfully",
        user
    })

});

export const updateUser = catchAsyncError(async (req, res, next) =>{
    const {currentPassword, newPassword, confirmNewPassword} = req.body;

    if(!currentPassword || !newPassword || !confirmNewPassword){
        return next(new ErrorHandler("Please fill all the fields", 400))
    }

    const isMatchedPassword = await bcrypt.compare(currentPassword, req.user.password)

    if(!isMatchedPassword){
        return next(new ErrorHandler("Current password is incorrect", 400))
    }

    if(newPassword !== confirmNewPassword){
        return next(new ErrorHandler("New password and confirm new password do not match", 400))
    }

    if(newPassword.length < 6 || newPassword.length > 16 || confirmNewPassword.length < 6 || confirmNewPassword.length > 16){
        return next(new ErrorHandler("New password must be between 6 and 16 characters", 400))
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10)

    await databaseConnection.query(`UPDATE users SET password = $1 WHERE id = $2`, [hashedNewPassword, req.user.id])
    
    res.status(200).json({
        success: true,
        message: "Password updated successfully"
    })
    //sendToken(updatedUser, 200, "Password updated successfully", res)
});

export const forgotPassword = catchAsyncError(async (req, res, next) =>{
    const {email} = req.body;
    const {frontendUrl} = req.query;

    // if(!email){
    //     return next(new ErrorHandler("Please provide email", 400))
    // }

    let userResult = await databaseConnection.query(`SELECT * FROM users WHERE email = $1`, [email])

    if(userResult.rows.length === 0){
        return next(new ErrorHandler("User not found with this email", 404))
    }

    const user = userResult.rows[0]

    const {resetToken, hashedToken, resetPasswordExpire} = generateResetPasswordToken()

    await databaseConnection.query(`
        UPDATE users SET 
        reset_password_token = $1, 
        reset_password_expires = to_timestamp($2)
        WHERE email = $3`, [hashedToken, resetPasswordExpire / 1000, email])

        const resetPasswordUrl = `${frontendUrl}/password/reset/${resetToken}`

        const message = resetPasswordMainTemp(resetPasswordUrl);

        try {
            await sendEmail({
                email: user.email,
                subject: "E-Commerce Password Reset Request",
                message
            })

            res.status(200).json({
                success: true,
                message: `Password reset email sent to ${user.email} successfully`
            })
        } catch (error) {
            await databaseConnection.query(`
                UPDATE users SET 
                reset_password_token = NULL, 
                reset_password_expires = NULL
                WHERE email = $1`, [email])
                console.log("Error in sending password reset email", error)
                return next(new ErrorHandler("E-mail could not be sent.", 500))
        }
});

export const resetPassword = catchAsyncError(async (req, res, next) =>{
    const token = req.params.token;
    const resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex")

    const user = await databaseConnection.query(`
        SELECT * FROM users 
        WHERE reset_password_token = $1 AND reset_password_expires > NOW()`, [resetPasswordToken])

        if(user.rows.length === 0){
            return next(new ErrorHandler("Invalid or expired password reset token", 400))
        }

        if(req.body.password !== req.body.confirmPassword){
            return next(new ErrorHandler("Password and confirm password do not match", 400))
        }

        if(req.body.password?.length < 6 || req.body.password?.length > 16 || req.body.confirmPassword?.length < 6 || req.body.confirmPassword?.length > 16){
            return next(new ErrorHandler("Password must be at least 6 characters long", 400))
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10)

        const updateUser = await databaseConnection.query(`
            UPDATE users SET 
            password = $1, 
            reset_password_token = NULL, 
            reset_password_expires = NULL
            WHERE id = $2
            RETURNING *`, [hashedPassword, user.rows[0].id])

            sendToken(updateUser.rows[0], 200, "Password reset successful", res);
    
});

export const updateAvatar = catchAsyncError(async (req, res, next) => {
        const { name, email} = req.body;
        if(!name || !email) {
            return next(new ErrorHandler("Pleas provide all the fields!", 400))
        }

        if(name.trim().length === 0 || email.trim().length === 0) {
            return next(new ErrorHandler("Name and E-mail could not be empty!", 400))
        }

        let avatarData = {};

        if(req.files && req.files.avatar){
            const {avatar} = req.files;

            if(req.user?.avatar?.public_id){
                await cloudinary.uploader.destroy(req.user.avatar.public_id)
            }

            const newProfileImage = await cloudinary.uploader.upload(avatar.tempFilePath, {
                folder: "ECommerce_Avatars",
                width: 150,
                crop: "scale"
            })

            avatarData = {
                public_id: newProfileImage.public_id,
                url: newProfileImage.secure_url
            }
 
        }

        let user;
        if(Object.keys(avatarData).length === 0){
            user = await databaseConnection.query(`
                UPDATE users SET 
                name = $1, 
                email = $2
                WHERE id = $3
                RETURNING *`, [name, email, req.user.id])
        } else {
            user = await databaseConnection.query(`
                UPDATE users SET 
                name = $1, 
                email = $2, 
                avatar = $3
                WHERE id = $4
                RETURNING *`, [name, email, avatarData, req.user.id])
        }

        res.status(200).json({
            success: true,
            message:"Profile Image Successfully Updated",
            user: user.rows[0]
        })
});

