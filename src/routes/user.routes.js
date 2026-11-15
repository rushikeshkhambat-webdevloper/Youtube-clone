import {Router} from "express";
import {loginUser, logoutUser, refreshAccessToken, registerUser} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js";
import {verifyJWT} from"../middlewares/auth.miiddleware.js"

const router = Router();

router.route("/register").post(
    upload.fields([
        {name:"avatar", maxCount:1},
        {name:"coverImage", maxCount:1}
    ]),
    registerUser
);

//router for login 
router.route("/login").post(loginUser)

//router for logout
router.route("/logout").post(verifyJWT, logoutUser)// here we bring our middlware before logout 

//refresh token for acces token (end point)
router.route("/refresh-token").post(refreshAccessToken)
export default router;