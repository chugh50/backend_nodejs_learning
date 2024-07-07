import { Router } from "express";
import {  logOutUsers, 
          loginUsers, 
          registerUser,
          refreshAccessToken,
          updatePassword,
          getCurrentUserDetails,
          changeAvatar,
          changeCoverImage,
          updateAccountDetails,
          userChannelDetails

        } from "../controllers/users.controllers.js";

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
router.route("/changePassword").post(verifyJwt,updatePassword);
router.route("/updateAccountDetails").patch(verifyJwt,updateAccountDetails);
router.route("/getCurrentUserDetails").get(verifyJwt,getCurrentUserDetails);

router.route("/changeAvatar").patch(verifyJwt,upload.single("avatar"),changeAvatar);
router.route("/coverImage").patch(verifyJwt,upload.single("coverImage"),changeCoverImage);

router.route("/userChannelDetails").get(verifyJwt,userChannelDetails);




export default router;