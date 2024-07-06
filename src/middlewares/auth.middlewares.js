import { ApiError } from "../utils/apierrors.js";
import { asyncHandler } from "../utils/asynchandler.js";
import jwt  from "jsonwebtoken";
import { User } from "../models/user.models.js";

const verifyJwt = asyncHandler(async(req,res,next) =>{
        try {
            const token = req.cookies?.accessToken;  //|| req.header("Authorization")?.replace("Bearer ", "")
    
    
            if(!token){
                throw new ApiError(401,"Error occur while retrieving token");
            }
            
            const decodeToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
            const user = User.findById(decodeToken?._id).select("-password -refreshToken");
            if(!user){
                throw new ApiError(401,"Invalid token");
    
            }
            req.user = user;
            next()
        } catch (error) {
            console.log(error);
            throw new ApiError(401,"Error occur during authentication");
            
        }


})


export default verifyJwt;