import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";
import { uploadToCloudinary,deletFromCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { Schema } from "mongoose";

const generateAccessAndRefreshTokens = async (user) => {
  try {
    // console.log(user);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiErrors(
      500,
      "Somthing went worng while generating access and refresh token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res

  // get user details from frontend
  const { username, fullName, email, password } = req.body;
  console.log({
    username,
    fullName,
    email,
    password,
  });

  // validation - not empty
  if (
    [username, fullName, email, password].some((value) => value?.trim() === "")
  ) {
    throw new ApiErrors(404, "All fields are required!");
  }

  // check if user already exists: username, email
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  // console.log(existedUser);

  if (existedUser) {
    throw new ApiErrors(
      409,
      "user with this username or email already exists!"
    );
  }

  // check for images, check for avatar
  // console.log(req.files);

  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }
  // console.log(avatarLocalPath, coverImageLocalPath);

  if (!avatarLocalPath) {
    throw new ApiErrors(404, "avatar file is required!");
  }

  // upload them to cloudinary, avatar
  const avatar = await uploadToCloudinary(avatarLocalPath);
  const coverImage = await uploadToCloudinary(coverImageLocalPath);
  console.log(avatar);

  // create user object - create entry in db
  const user = await User.create({
    username,
    fullName,
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage.url || "",
  });

  // remove password and refresh token field from response
  const currentUser = await User.findById(user._id)?.select(
    "-password -refreshToken"
  );

  // check for user creation
  if (!currentUser) {
    throw new ApiErrors(500, "Somthing went wrong while creating user");
  }

  // return res
  return res
    .status(201)
    .json(new ApiResponse(currentUser, 200, "user created successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // get data from FE
  // validate user details
  // check wethere user exist or not
  // check for password
  // access refresh and access token
  // send cookie

  const { username, email, password } = req.body;

  if (!(username || email)) {
    throw new ApiErrors(400, "Please enter username or email");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiErrors(401, "Invalid user password");
  }

  const { refreshToken, accessToken } =
    await generateAccessAndRefreshTokens(user);

  // console.log(user);

  const currentUser = await User.findOne({
    $or: [{ username }, { email }],
  }).select("-password -refreshToken");

  // console.log(currentUser);

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        {
          user: currentUser,
          accessToken,
          refreshToken,
        },
        200,
        "User logged-In successfully~"
      )
    );
});

const loggoutUser = asyncHandler(async (req, res) => {
  console.log(req.user._id);
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  console.log(user);

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse({}, 200, "User logged-Out!"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiErrors(400, "Unauthorize request");
  }

  const decodedToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );

  if (!decodedToken) {
    throw new ApiErrors(401, "Invalid refresh token access");
  }

  const user = await User.findById(decodedToken._id);

  if (!user) {
    throw new ApiErrors(401, "Invalid refresh token access");
  }

  if (user.refreshToken !== incomingRefreshToken) {
    throw new ApiErrors(401, "Refresh token is expired or used");
  }

  const { accessToken, refreshToken } =
    await generateAccessAndRefreshTokens(user);

  const option = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
      new ApiResponse({ accessToken, refreshToken }, 200, "Token refreshed")
    );
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  console.log(currentPassword, newPassword);
  if (!currentPassword || !newPassword) {
    throw new ApiErrors(400, "All fields are required");
  }

  const user = await User.findById(req.user?._id);

  const isPasswordValid = await user.isPasswordCorrect(currentPassword);

  if (!isPasswordValid) {
    throw new ApiErrors(401, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse({}, 200, "Password changed sussfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(req.user, 200, "Current user"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email, username } = req.body;
  console.log(fullName, email, username);

  if (!(username || email || fullName)) {
    throw new ApiErrors(200, "Atleast one feild is required");
  }

  const updateFields = {};
  const fieldsToUpdate = ["username", "email", "fullName"];

  fieldsToUpdate.forEach((field) => {
    if (req.body[field]) {
      updateFields[field] = req.body[field];
    }
  });

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: updateFields,
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(user, 200, "Updated user details"));
});

const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiErrors(400, "avatar is required");
  }

  const avatar = await uploadToCloudinary(avatarLocalPath);
  console.log(avatar);

  if (!avatar) {
    throw new ApiErrors(400, "Error while uploading to cloud ");
  }

  const user = await User.findById(req.user?._id).select("-password -refreshToken")

  const response = await deletFromCloudinary(user.avatar)

  user.avatar = avatar.url

  await user.save({validateBeforeSave:false})
  
  return res
    .status(200)
    .json(new ApiResponse(response, 200, "Avatar updated successfully"));
});

const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiErrors(400, "coverImage is required");
  }

  const coverImage = await uploadToCloudinary(coverImageLocalPath);

  if (coverImage) {
    throw new ApiErrors(400, "Error while uploading coverImage to cloud");
  }

  await User.findByIdAndDelete(
    req.user?._id,
    {
      $set: {
        coverImage,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(new ApiResponse({}, 200, "updated cover Image successfully"));
});

const getUserChannelDetails = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiErrors(400, "username is required");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscriberCount: {
          $size: "$subscribers",
        },
        subscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        username: 1,
        fullName: 1,
        coverImage: 1,
        avatar: 1,
        email: 1,
        subscriberCount: 1,
        subscribedToCount: 1,
        isSubscribed: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiErrors(404, "channel does not exists");
  }

  return res
    .status(200)
    .json(new ApiResponse(channel[0], 200, "user channel fetched"));
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: Schema.Types.ObjectId(req.user?._id),
      },
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
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(user[0], 200, "watch history fetched successfully"));
});

export {
  registerUser,
  loginUser,
  loggoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
  getUserChannelDetails,
  getWatchHistory,
};
