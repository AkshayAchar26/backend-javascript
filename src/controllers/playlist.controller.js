import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Playlist } from "../models/playlist.model.js";


const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name || !description)
    throw new ApiErrors(404, "name and description are required");
  if (!req.user._id) throw new ApiErrors(404, "Logged-in user required");

  try {
    const existedPlaylist = await Playlist.findOne({
      $and: [{ name }, { description }, { owner: req.user?._id }],
    });

    if (existedPlaylist)
      throw new ApiErrors(
        401,
        "A playlist with this name and description is already exist"
      );

    const response = await Playlist.create({
      name,
      description,
      owner: req.user?._id,
    });

    if (!response) throw new ApiErrors(404, "Cant create playlist");

    return res
      .status(200)
      .json(new ApiResponse(response, 200, "Successfully created playlist"));
  } catch (error) {
    throw new ApiErrors(500, "Somthing went wrong while creating playlist");
  }
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) throw new ApiErrors(404, "User id is required");

  try {
    const playlists = await Playlist.findOne({
      owner: userId,
    });

    if (!playlists) throw new ApiErrors(404, "unable to retrive playlist");

    return res
      .status(200)
      .json(new ApiResponse(playlists, 200, "Successfully retrived playlist"));
  } catch (error) {
    throw new ApiErrors(500, "Somthing went wrong while getting playlist");
  }
});

// **** //
const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!playlistId) throw new ApiErrors(404, "playlist Id is required");

  try {
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) throw new ApiErrors(404, "playlist not found");

    return res
      .status(200)
      .json(new ApiResponse(playlist, 200, "successfully reterived playlist"));
  } catch (error) {
    throw new ApiErrors(500, "Somthing went wrong while getting playlist");
  }
});

//  **** //
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!playlistId || !videoId)
    throw new ApiErrors(404, "PlaylistId and videoId are required");

  try {
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) throw new ApiErrors(404, "Playlist not found");

    playlist.videos.pull(videoId);
    await playlist.save();

    return res
      .status(200)
      .json(
        new ApiResponse({}, 200, "Successfully removed video from playlist")
      );
  } catch (error) {
    throw new ApiErrors(
      500,
      "Somthing went wrong while removing video from playlist"
    );
  }
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  removeVideoFromPlaylist,
};
