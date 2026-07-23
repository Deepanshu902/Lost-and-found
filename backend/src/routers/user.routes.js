import {Router} from "express"

import { changePassword, CurrentUser, loginUser,logout,registerUser, updateAccountDetails, refreshAccessToken } from "../controller/user.controller.js"

import {verifyJWT} from "../middleware/auth.middleware.js"

import { upload } from "../middleware/multer.middleware.js"


const router = Router()

router.use(upload.none());

router.route("/login").post(loginUser)

router.route("/register").post(registerUser)

router.route("/refresh-token").post(refreshAccessToken)

// secured Routes

router.route("/logout").post(verifyJWT,logout)

router.route("/current-user").get(verifyJWT,CurrentUser)

router.route("/change-password").post(verifyJWT,changePassword)

router.route("/update-details").post(verifyJWT,updateAccountDetails)

export default router