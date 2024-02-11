import { Likes } from "../models/likes.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) throw new ApiErrors(404, "VideoId is required");
  if (!req.user._id) throw new ApiErrors(404, "UserId is required");

  try {
    const existingLike = await Likes.findOne({
      $and: [{ video: videoId }, { likedBy: req.user._id }],
    });

    if (!existingLike) {
      const response = await Likes.create({
        video: videoId,
        likedBy: req.user._id,
      });

      console.log(response);

      return res
        .status(200)
        .json(new ApiResponse(true, 200, "Successfully created like"));
    }

    let result;
    if (!existingLike.video) {
      existingLike.video = videoId;
      result = true;
    } else {
      existingLike.video = undefined;
      result = false;
    }

    existingLike.save();

    return res
      .status(200)
      .json(new ApiResponse(result, 200, "Successfully toggled like"));
  } catch (error) {
    throw new ApiErrors(500, "Somthing went wrong while toggeleing like");
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!commentId) throw new ApiErrors(404, "commentId is required");
  if (!req.user._id) throw new ApiErrors(404, "UserID is required");

  try {
    const existingCommentLike = await Likes.findOne({
      $and: [{ likedBy: req.user._id }, { comment: commentId }],
    });

    if (!existingCommentLike) {
      const response = await Likes.create({
        likedBy: req.user._id,
        comment: commentId,
      });

      console.log(response);

      return res
        .status(200)
        .json(new ApiResponse(true, 200, "Successfully created comment like"));
    }

    let result;
    if (!existingCommentLike.comment) {
      existingCommentLike.comment = commentId;
      result = true;
    } else {
      existingCommentLike.comment = undefined;
      result = false;
    }

    existingCommentLike.save();

    return res
      .status(200)
      .json(new ApiResponse(result, 200, "Successfully toggled comment like"));
  } catch (error) {
    throw new ApiErrors(
      500,
      "Somthing went wrong while toggleing comment like "
    );
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const likedVideos = await Likes.aggregate([
    {
      $match: {
        likedBy: req.user?._id,
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
      },
    },
    {
      $unwind: "$video",
    },
    {
      $project: {
        video: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(likedVideos, "Successfully reterived liked videos"));
});

export { toggleCommentLike, toggleVideoLike, getLikedVideos };
