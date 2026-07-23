import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import jwt from "jsonwebtoken"

import {User} from "../models/user.models.js"


const  generateAccessAndRefreshTokens = async(userId)=>{
    try{
       const user = await User.findById(userId)
     const accessToken =  user.generateAccessToken()
      const refreshToken=  user.generateRefreshToken()
 
       user.refreshToken = refreshToken // save value to db 
       await  user.save({ validateBeforeSave : false })  // save the updated user
       // dont do any validation just save the user
 
       return {refreshToken,accessToken}
 
    }
    catch(error){
       throw new ApiError(501,"Something went wrong while generating refresh and access token ")
    }
 }



const options = {
    httpOnly:true, 
    secure:true,
    sameSite: "none"
 }


const loginUser = asyncHandler(async(req,res)=>{
    const {email,password} = req.body

    if(!email || !password){
        throw new ApiError(500,"Both email and password is required")
    }

    const user =  await User.findOne({
        $or : [{email}]
     })

    if(!user){
     throw new ApiError(500,"No user exist ")
     
    }

    const givenPassword = await user.isPasswordCorrect(password)

    if(!givenPassword){
        throw new ApiError(401,"Password is not correct")
    }

    const {refreshToken,accessToken} =  await generateAccessAndRefreshTokens(user._id) 

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
     )

     return res.status(200)
      .cookie("accessToken",accessToken,options)
      .cookie("refreshToken",refreshToken,options)
      .json(
         new ApiResponse(200,
            {
            user:loggedInUser,accessToken,refreshToken  // good practise to send them seperately also after sending cookie
         },
         "User Logged In Successfully"
      )
      )
    })

const registerUser = asyncHandler(async(req,res)=>{
    const {email,password,username,name,number} = req.body

    if(!email || !password || !username ||!name){
        throw new ApiError(401,"All the feilds are required")
    }

    const existedUser = await User.findOne({
        $or:[{email},{username}]
    })

    if(existedUser){
        throw new ApiError(401,"User Already Exist")
    }

    const user = await User.create({
        email,
        password,
        username:username.toLowerCase(),
        name,
        number
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something went wrong ")
     }


    return res.status(200).json(new ApiResponse(200,createdUser,"User Created Successfully ")) 

    })

const logout = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
           $set:{
              refreshToken: undefined
           }
           },
           {
              new: true
           }
        
      )
      
  
     return res.status(200).
     clearCookie("accessToken",options).
     clearCookie("refreshToken",options).
     json(new ApiResponse(200,{},"User Logged out"))
})

const CurrentUser = asyncHandler(async(req,res)=>{
    return res.status(200).json(new ApiResponse(200,req.user,"CurrentUser Fetch successfully"))
})

const changePassword = asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword} = req.body

    if(!oldPassword || !newPassword){
        throw new ApiError(401,"Old and New Password is required")
    }

    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError(500,"Error while changing password")
    }

    const isPasswordcorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordcorrect){
        throw new ApiError(401,"Old password is not correct")
    }

    user.password = newPassword
      await user.save({validateBeforeSave:false})


    
    return res.status(200).json(new ApiResponse(200,{},"Password Updated Successfully"))

    
})

const updateAccountDetails = asyncHandler(async(req,res)=>{

    const {name,email,number} = req.body
    
          if(!name || !email){
             throw new ApiError(401,"name and email is required")
          }
    
        const user = await User.findByIdAndUpdate(
          req.user?._id,
          {
             $set:{
                name: name ,
                 email : email,
                 number:number
             }
          },
          {new:true}
         ).select("-password  ")
    
         return res.status(200).json(new ApiResponse(200,user,"Account Details Updated"))
  })


const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken },
                    "Access token refreshed successfully"
                )
            );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
})


export {
    loginUser,
    registerUser,
    logout,
    CurrentUser,
    changePassword,
    updateAccountDetails,
    refreshAccessToken
}