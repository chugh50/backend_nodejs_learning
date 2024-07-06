import { ApiError } from "../utils/apierrors.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { User } from "../models/user.models.js";

import { uploadFileOnCloudinary } from "../utils/cloudinary.js";

import { ApiResponse } from "../utils/apiresponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId);    
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave : false});
        return {accessToken, refreshToken}
    } catch (error) {
        console.log(error);
        throw new ApiError(500,"Something went wrong while creating tokens");
    }
}



const loginUsers = asyncHandler( async(req,resp) =>{
       const {username,email,password} = req.body;
        if(!(username || email)){
            throw new ApiError(400,"Please provide username or email");
        }

        const user = await User.findOne({
            $or: [ {username}, {email} ]
        })

        if(!user){
            throw new ApiError(400,"User doesnot exist ");
        }

        const passwordCheck = await user.isCorrectPassword(password);
        console.log(password,passwordCheck);
        if(!passwordCheck){
            throw new ApiError(400,"Please enter correct password");
        }
        const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id);

        const loggedINUser = await User.findById(user._id).select("-password -refreshToken");
        const options = {
            httpOnly:true,
            secure: true
        }

        return resp
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",refreshToken,options)
        .json(
            new ApiResponse(200,
                    {
                        users:loggedINUser,accessToken,refreshToken
                    },
                    "Users SuccessFully LoggedIn "
                )
        )

})

const logOutUsers = asyncHandler(async (req,res)=> {
        await User.findByIdAndUpdate(
                req.user._id,
                {
                    $set:{
                        refreshToken:undefined
                        }   
                },
                {
                    new:true
                }
                )
        const options ={
            httpOnly:true,
            secure: true
        }

        res
        .status(200)
        .clearCookie("accesToken",options)
        .clearCookie("refreshToken",options)
        .json(
            new ApiResponse(
                200,
                {},
                "User Logout Successfully"
            )
        )
})


const registerUser = asyncHandler(async (req,res) => {
    
    const { username,fullName,email , password} = req.body;

    if(
        [username,fullName,email,password].some((fields) => {
            fields?.trim() === ""
        })
    ){
        throw new ApiError(400,"All fields are mandatory")
    }

    const existedUser =  await User.findOne({
                            $or:[{ username },{ email }]
                        });
    if( existedUser ){
        throw new ApiError(409,"This user already exist");
    }

    const avatarLocalPath =  req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required");
    }

    const avatar = await  uploadFileOnCloudinary(avatarLocalPath);
    const coverImage = await uploadFileOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400,"Avatar file is required");
    }

    const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage : coverImage?.url || "",
        username: username.toLowerCase(),
        email,
        password
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToker"
    )    

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while register user" );
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User Registered Successfully")
    )
})



const refreshAccessToken = asyncHandler(async (req,res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if(!incomingRefreshToken){
        throw new ApiError(400,"Refresh Token is not valid");
    }

    const decodeRefreshToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
    if(!decodeRefreshToken){
        throw new ApiError(400,"Refresh Token is not valid");
    }

    const user = await User.findById(decodeRefreshToken?._id);    

    const refreshToken = user.refreshToken;
    if( user.refreshToken !== incomingRefreshToken){
        throw new ApiError("Refresh token expired or used");
    }

    const {accessToken,newrefreshToken}  = await generateAccessAndRefreshTokens(user._id);

    const options ={
        httponly:true,
        secure: true
    }

    return  res
            .status(200)
            .cookie("accessToken",accessToken,options)
            .cookie("refreshToken",newrefreshToken,options)
            .json(
                new ApiResponse(
                    200,
                    {accessToken,refreshToken: newrefreshToken},
                    "Send Refresh Token Successfully"
                )
            )



})

// const updatePassword = asyncHandler( async (req,res) =>{
//     const {oldPassword,newPassword} = req.body;
//     const user =  await User.findById(req.user?._id);
//     user.
    
// })



export {registerUser,loginUsers,logOutUsers,refreshAccessToken};