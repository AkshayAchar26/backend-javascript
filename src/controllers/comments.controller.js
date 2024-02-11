import { Comments } from "../models/comments.model.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  try {
    await Comments.aggregate([
      {
        $match: {
          video: videoId,
        },
      },
      {
        $skip: (page - 1) * parseInt(limit),
      },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      {
        $unwind: "$userInfo",
      },
      {
        $project: {
          _id: 1,
          username: "$userInfo.username",
          content: 1,
          createdAt: 1,
        },
      },
    ]);
  } catch (error) {
    throw new ApiErrors(500, "Somthing went wrong while getting all comments");
  }
});

const addComment = asyncHandler(async (req, res) => {
  const { comments } = req.body;
  const { videoId } = req.params;

  if (!req.user._id) throw new ApiErrors(404, "Only Logged in are allowed");
  if (!comments) throw new ApiErrors(404, "comments are required");

  try {
    const response = await Comments.create({
      content: comments,
      video: videoId,
      owner: owner,
    });

    return res
      .status(200)
      .json(new ApiResponse(response, 200, "Successfully commented on video"));
  } catch (error) {
    throw new ApiErrors(
      500,
      "somthing went wrong while adding comments",
      error
    );
  }
});

const updateComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { comments } = req.body;

  if (!videoId) throw new ApiErrors(404, "Video id is required");
  if (!req.user._id) throw new ApiErrors(404, "user id is required");

  try {
    const response = await Comments.findOneAndUpdate(
      {
        $and: [{ video: videoId }, { owner: req.user?._id }],
      },
      {
        $set: {
          content: comments,
        },
      },
      {
        new: true,
      }
    );

    return res
      .status(200)
      .json(new ApiResponse(response, 200, "Successfully updated comments"));
  } catch (error) {
    throw new ApiErrors(
      500,
      "Somthing went wrong while updating comments",
      error
    );
  }
});

const deleteComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) throw new ApiErrors(404, "video id is required");
  if (!req.user?._id)
    throw new ApiErrors(404, "Only logged-in users are allowed");

  try {
    const response = await Comments.findOneAndDelete({
      $and: [{ video: videoId }, { owner: req.user?._id }],
    });

    return res
      .status(200)
      .json(new ApiResponse(response, 200, "Successfully deleted comments"));
  } catch (error) {
    throw new ApiErrors(500, "Somthing went wrong while deleting comments");
  }
});

export { getVideoComments, addComment, updateComment, deleteComment };
