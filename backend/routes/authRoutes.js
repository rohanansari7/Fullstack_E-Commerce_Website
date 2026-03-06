import express from "express"
import { register, login, getUser, logout, forgotPassword, resetPassword, updateUser } from "../controllers/auth.js"
import {isAuthenticated, authorizeRoles } from "../middlewares/authMiddleware.js"

const router = express.Router()

router.post("/register", register)
router.post("/login", login)
router.get("/get-user", isAuthenticated, getUser)
router.get("/log-out", isAuthenticated, logout)
router.post("/password/forgot", forgotPassword)
router.put("/password/reset/:token", resetPassword)
router.put("/password/update", isAuthenticated, updateUser)

export default router