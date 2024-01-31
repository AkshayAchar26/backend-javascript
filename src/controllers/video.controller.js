import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import {
  deletFromCloudinary,
  uploadToCloudinary,
} from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const updateThumbnail = async (thumbnailFilePath, video) => {
  const thumbnail = await uploadToCloudinary(thumbnailFilePath);

  if (!thumbnail) {
    throw new ApiErrors(
      500,
      "Somthing went wrong while uploading thumbnail to cloud"
    );
  }

  await deletFromCloudinary(video.thumbnail);

  return { thumbnail };
};

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    throw new ApiErrors(404, "title and description is required");
  }

  try {
    const existVideo = await Video.findOne({ title });

    if (existVideo) {
      throw new ApiErrors(409, "A video with this title is already exists");
    }

    const videoFileLocalPath = req.files?.video[0].path;
    const thumbnailLocalPath = req.files?.thumbnail[0].path;

    let thumbnail;
    if (thumbnailLocalPath) {
      thumbnail = await uploadToCloudinary(thumbnailLocalPath);

      if (!thumbnail) {
        throw new ApiErrors(
          401,
          "Somthing went wrong while uploading thumbnail to cloud"
        );
      }
    }

    if (!videoFileLocalPath) {
      throw new ApiErrors(404, "Video file is required");
    }

    const videoFile = await uploadToCloudinary(videoFileLocalPath);

    if (!videoFile) {
      throw new ApiErrors(
        500,
        "Somthing went wrong while uploading video to cloud"
      );
    }

    const response = await Video.create({
      videoFile: videoFile.url,
      thumbnail: thumbnail.url || videoFile.playback_url,
      owner: req.user?._id,
      title,
      description,
      duration: videoFile.duration,
    });

    console.log(response);

    return res
      .status(200)
      .json(new ApiResponse(response, 200, "video uploaded successfully"));
  } catch (error) {
    throw new ApiErrors(400, "Somthing went wrong while uploading", error);
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiErrors(400, "video id is required");
  }

  const video = await Video.findById(videoId).select("-isPublished -updatedAt");

  if (!video) {
    throw new ApiErrors(400, "Video is not avaliable");
  }

  return res
    .status(200)
    .json(new ApiResponse(video, 200, "video reterived successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiErrors(404, "VideoId is required");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiErrors(404, "Video not found");
  }

  if (!(video.owner.toString() === req.user._id.toString())) {
    throw new ApiErrors(401, "Invalid user access");
  }

  const updateFields = {};
  const fieldsToUpdate = ["title", "description"];

  fieldsToUpdate.forEach((field) => {
    if (req.body[field]) {
      updateFields[field] = req.body[field];
    }
  });

  const thumbnailLocalPath = req.file?.path;
  console.log(thumbnailLocalPath);
  if (thumbnailLocalPath) {
    const { thumbnail } = await updateThumbnail(thumbnailLocalPath, video);
    updateFields["thumbnail"] = thumbnail.url;
  }

  if (Object.keys(updateFields).length === 0) {
    throw new ApiErrors(404, "Atleast one field is required");
  }

  console.log(updateFields);

  const response = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: updateFields,
    },
    {
      new: true,
    }
  ).select("-views -updatedAt -createdAt ");

  console.log(response);

  return res
    .status(200)
    .json(new ApiResponse(response, 200, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  try {
    const video = await Video.findById(videoId);

    if (!video) {
      throw new ApiErrors(404, "video not found");
    }

    if (!(req.user?._id.toString() === video.owner.toString())) {
      throw new ApiErrors(401, "Invalid user access");
    }

    const deleteVideoFromCloud = await deletFromCloudinary(video.videoFile, {
      resource_type: "video",
    });

    const deleteThumbnailFromCloud = await deletFromCloudinary(video.thumbnail);

    if (!deleteVideoFromCloud || !deleteThumbnailFromCloud) {
      throw new ApiErrors(
        500,
        "somthing went wrong while deleting video/thumbnail from cloud"
      );
    }

    await video.deleteOne();

    return res
      .status(200)
      .json(new ApiResponse({}, 200, "video deleted successfully"));
  } catch (error) {
    throw new ApiErrors(401, "Somthing went wrong while deleting video", error);
  }
});

export { getAllVideos, publishAVideo, getVideoById, updateVideo, deleteVideo };
