import JWT from "jsonwebtoken";

export const sendToken = (user, statusCode, message, res) => {
    const token = JWT.sign({id: user.id}, process.env.JWT_SECRET_KEY, {
        expiresIn: process.env.JWT_EXPIRES_IN
    })

    res.status(statusCode).cookie("token", token, {
        expires: new Date(Date.now() + process.env.COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    }).json({
        success: true, 
        message,
        token,
        user
        // user: {
        //     id: user.id,    
        //     name: user.name,
        //     email: user.email
        // }
    })
}