
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/Api.Error.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudnary.js";
import { ApiResponse } from "../utils/Apiresponse.js";
import jwt from"jesonwebtoken"



//generateaccesstokenand refresh token 
const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        console.log("real token error",error)
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // alogrithm to register user in steps 
    /* 
    1.Get user deatils form forntend 
    2.check validation -check user data field r
    3.Check if user is already exits -check username and email 
    4.Get avatar and cover images paths 
    5.upload it on cloudinary and get url of the images of avatar and cover image
    6. Create user in db
    7.Remove password and refresh token from response 
    8. retun response 
    */

    // Get user details from frontend
    const { fullName, email, username, password } = req.body;

    // Validation - check empty fields
    if (
        [fullName, email, username, password].some(
            (field) => field?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }

    // Check if user already exists
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
});         

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists");
    }

    // Get avatar and cover image paths
    const avatarLocalPath = req.files?.avatar?.[0]?.path;

    let coverImageLocalPath;

    if (
        req.files &&
        Array.isArray(req.files.coverImage) &&
        req.files.coverImage.length > 0
    ) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    // Check avatar
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    // Upload images to Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);

    const coverImage = coverImageLocalPath
        ? await uploadOnCloudinary(coverImageLocalPath)
        : null;

    if (!avatar?.url) {
        throw new ApiError(400, "Avatar upload failed on Cloudinary");
    }

    // Create user in database
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    });

    // Remove password and refresh token from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new ApiError(
            500,
            "Something went wrong while registering the user"
        );
    }

    // Return response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    );

});


//login user 
const loginUser = asyncHandler(async (req, res) =>{
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

    const {email, username, password} = req.body
    console.log(email);

    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }
    
    // Here is an alternative of above code based on logic discussed in video:
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")
        
    // }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

   const isPasswordValid = await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
    }

   const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})


const logoutUser=asyncHandler(async(req,res)=>{
    // alogrithm to logout user first we have to design our own middlware for it  and we design this middlware to get token because if we not gave token to user then onnly we can logout 
    // now we desing our middlware so we can get user when we req for user then we will do req.user get user details and from that we will deleter refrestoken (tokens )
      await User.findByIdAndUpdate(
        req.user._id,{
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }

      )

      const options={
        httpOnly:true,
        secure:true
      }
      return res
      .status(200)
      .clearCookie("accessToken",options)
      .clearCookie("refreshToken",options)
      .json(new ApiResponse(200,{},"User logged Out"))
})

const refreshAccessToken= asyncHandler(async (req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401,"unauthorized request")
    }
    try {
        const decodedToken = jwt.verify(// here decodetoken means it is in perfect object key valude strucutre so we can used it properly 
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
       const user= User.findById(decodedToken?._id)
       if(!user){
        throw new ApiError(401,"Invalid refresh token ")
       }
       if(incomingRefreshToken !== user?.refreshToken){
        throw new ApiError(401,"Refresh token is expired or used")
       }
    
       const options={
        httponly:true,
        secure:true
       }
    
      const {accessToken,refreshToken}=await generateAccessAndRefereshTokens(user._id)
    
      return res
      .status(200)
      .cookie("accessToken",accessToken)
      .cookie("refreshToken",refreshToken)
      .json(
        new ApiResponse(
            200,
            {
                accessToken, refreshToken : newRefreshToken
            },
            "Access token refresh Successfully"
        )
      )
    
    
    }catch (error) {
        throw new ApiError(401,error?.message ||"Invalid refresh token" )
    }
})
// hence we are writting controller for user we have to write some basic controllers tooo 
const changeCurrentPassword= asyncHandler(async(req,res)=>{
    const{oldPassword,newPassword}=req.body
    const user= await User.findById(req.user?._id)// auth middleware
    const isPasswordCorrect= await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400,'Invalid old password')
    }

    // now lets saved new password 
    user.password=newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password changed successfully"))

})

// we also need a current user 
const getCurrentUser= asyncHandler(async(req,res)=>{
         return res
        .status(200)
        .json(new ApiResponse (200,req.user,"current user fetched successfully"))// we get req.user from authmiddleware 

})

//update users details 
const updateAccountDetails= asyncHandler(async(req,res)=>{
    const {fullName,email}=req.body

    if(!fullName || !email){
        throw new ApiError(400,"All fileds are required ")
    }


   const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{// now here using set operoator of mongodb we upadate the user acc details 
                fullName,
                email:email
            }
        },
        {new:true}
    ).select("-password")// we dont want password 

    return res
    .status()
    .json(new ApiResponse(200,user,"Account details updated successfully"))
})


//update the avatar 
const updateUserAvatar=asyncHandler(async(req,res)=>{
   const avatarLocalPath= req.file?.path// we get it from multer middleware 

   if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is missing")
   }

   const avatar= await uploadOnCloudinary(avatarLocalPath)

   if(!avatar.url){
    throw new ApiError(400,"Error while uploading on avatar")
   }


   await  User.findByIdAndUpdate(// we used this method to update and mongodb operator name set to update the particualr things 
    req.user?._id,
    {
        $set:{
            avatar:avatar.url
        }
    },
    {new:true}
   ).select("-password")

   return res
   .status(200)
   .json(new ApiResponse(200,user,"Avatat Image updated successfully"))

  
})

//change cover image 
const updateUserCoverImage=asyncHandler(async(req,res)=>{
   const coverImageLocalPath= req.file?.path// we get it from multer middleware 

   if(!coverImageLocalPath){
    throw new ApiError(400,"Cover image file is missing")
   }

   const coverImage= await uploadOnCloudinary(coverImageLocalPath)

   if(!coverImage.url){
    throw new ApiError(400,"Error while uploading on avatar")
   }


  const user= await  User.findByIdAndUpdate(// we used this method to update and mongodb operator name set to update the particualr things 
    req.user?._id,
    {
        $set:{
               coverImage: coverImage.url
        }
    },
    {new:true}
   ).select("-password")

   return res
   .status(200)
   .json(new ApiResponse(200,user,"Cover Image updated succesfully"))
    


  
})



const getUserChannelProfile= asyncHandler(async(req,res)=>{
    const{username}= req.params
    if(!username?.trim()){
        throw new ApiError(400,"username is missing")
    }


    // now we have to find the username in this case we will used aggreation pipeline 
        const channel= await User.aggregate([// we have to join subscriber to user so its left join we are doing hre 
           //pipeline first
           { 
                $match:{
                    //stage 1
                    username:username?.toLowerCase()
                }
           },
           {
               // here we find the subscriber for the one channel 
                $lookup:{
                    from: "subscriptions",// from schmea 
                    localField:"_id",
                    foreginField:"channel",//from schema 
                    as:"subscribers"
                }

           },
           {
                // here we have to find to how many channels we sbuscribed 
                $lookup:{
                   from: "subscriptions",// from schmea 
                    localField:"_id",
                    foreginField:"subscriber",//from schema 
                    as:"subscribedTo" 
                }
           },
           {
           // HERE WE ADD THE MORE TWO FIELDS 
               $addFields:{
                subscriberCount:{
                    $size:"$subscribers"
                },
                channelSubscribedToCount:{
                    $size:"subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id, "$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
                
               }
           },
           {
              $project:{// used to get selected things  
                   fullName:1,
                   userName:1,
                   subscriberCount:1,
                   channelSubscribedToCount:1,
                   isSubscribed:1,
                   avatar:1,
                   coverImage:1,
                   email:1

              }

           }
        ])
        // if we dont have channel 
        if(!channel?.length){
            throw new ApiError(404,"channel does not exists ")
        }
        return res
        .status(200)
        .json(new ApiResponse(200,channel[0],"User channel fetched succesfully"))

})

const getWatchHitory=asyncHandler(async(req,res)=>{
      const user= await User.aggregrat([  

         {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})




export { registerUser ,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHitory

};
