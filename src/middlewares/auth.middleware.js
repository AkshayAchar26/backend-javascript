import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiErrors("400", "Invalid access Token");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken._id)?.select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiErrors(401, "Invalid token access");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiErrors("400", error?.message || "Invalid access token");
  }
});
