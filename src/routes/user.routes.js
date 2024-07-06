import { Router } from "express";
import { logOutUsers, loginUsers, registerUser,refreshAccessToken } from "../controllers/users.controllers.js";

import { upload } from "../middlewares/multer.middlewares.js";
import verifyJwt from "../middlewares/auth.middlewares.js";



const router = Router();
//console.log("Inside user routes");




router.route("/register").post(
    upload.fields([
        { name : "avatar",
          maxCount :1  
        },
        { name : "coverImage",
          maxCount : 1  
        }
    ]),
    registerUser
    );

router.route("/login").post(loginUsers);

router.route("/logout").post(verifyJwt,logOutUsers);
router.route("/refreshToken").post(refreshAccessToken);

export default router;