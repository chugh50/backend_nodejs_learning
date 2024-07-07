import { ApiError } from "../utils/apierrors.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { User } from "../models/user.models.js";
import { Subscription } from "../models/subscription.models.js";
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

const updatePassword = asyncHandler( async (req,res) =>{
    const {oldPassword,newPassword} = req.body;
    const user =  await User.findById(req.user?._id);
    isPasswordCorrect  = await user.isCorrectPassword(isCorrectPassword);
    if(!isPasswordCorrect){
        throw new ApiError(400,"Incorrect Password")
    }
    user.password = newPassword;
    await user.save({validateBeforeSave:false});
    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Password Updated Successfully"
        )
    )
})

const updateAccountDetails = asyncHandler(async(req,res) => {
    const {fullName,email} = req.body;

    if(!fullName || !email){
        throw new ApiError(400,"All fields are required");
    }
    const user  = User.findByIdAndUpdate(req.user._id,
                                         {
                                            $set:{
                                                fullName:fullName,
                                                email:email
                                            }
                                         },
                                         {
                                            new:true
                                         }   
                                        ).select("-password");
    return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    user,
                    "Details Updated Successfully"
                )
            )                                     
})  


const getCurrentUserDetails = asyncHandler( async (req,res) =>{
    
    return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    req.user,
                    "Send user details"
                )
            )
})


const changeAvatar = asyncHandler(async(req,res) => {
    const { avatarLocalPath } = req.file?.avatar;
    if(!avatarLocalPath ){
        throw new ApiError(400,"Avatar file is required");
    }

    const avatar  =   uploadFileOnCloudinary(avatarLocalPath);
    if(!avatar.url){
        throw new ApiError(400,"Avatar url is missing");
    }




    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new:true}
        ).select("-password");
        
        return  res
                .status(200)
                .json(
                    new ApiResponse(200, user, "Avatar image updated successfully")
                     )

})

const changeCoverImage = asyncHandler(async(req,res) => {
    const {coverImageLocalPath } = req.file?.avatar;
    if(!coverImageLocalPath ){
        throw new ApiError(400,"Avatar file is required");
    }

    const coverImage  =   uploadFileOnCloudinary(coverImageLocalPath);
    if(!coverImage.url){
        throw new ApiError(400,"Avatar url is missing");
    }




    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new:true}
        ).select("-password");
        
        return  res
                .status(200)
                .json(
                    new ApiResponse(200, user, "Avatar image updated successfully")
                     )

})


const userChannelDetails = asyncHandler(async (req,res) =>{
    const { username } = req.params;
    if(!username?.trim()){
        throw new ApiError(400,"username is not correct");
    }

    const channel = await User.aggregate(
        [
            {
                $match:{
                    username:username?.toLowerCase()
                }
            },
            {
                $lookup:{
                    from:"subscriptions",
                    localField:"_id",
                    foreignField:"channel",
                    result:"subscribers"

                }
            },
            {
                $lookup:{
                    from:"subscriptions",
                    localField:"_id",
                    foreignField:"subscriber",
                    result:"subscribertobe"

                }
            },
            {
                $addFields:{
                    subscribersCount:{
                        $size:"$subscribers"
                    },
                    subscriberToBeCount:{
                        $size:"$subscriberstobe"
                    },
                    isSubscribed:{
                        if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                        then: true,
                        else:false
                    }

                }
            },
            {
                $project:{
                    email:1,
                    username:1,
                    fullName:1,
                    avatar:1,
                    coverImage:1,
                    subscribersCount:1,
                    subscriberToBeCount : 1                    

                }
            }
        ]
    )

    if(!channel?.length){
        throw new ApiError(400,"channel doesnot exist");
    }

    return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    channel[0],
                    "User Channel fetch successfully"
                )
            )

})




export {registerUser
    ,loginUsers
    ,logOutUsers
    ,refreshAccessToken
    ,updatePassword
    ,getCurrentUserDetails
    ,changeAvatar
    ,changeCoverImage
    ,updateAccountDetails
    ,userChannelDetails
};