import { Router } from "express";
import {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  removeVideoFromPlaylist,
} from "../controllers/playlist.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/create-playlist").post(verifyJWT, createPlaylist);
router.route("/get-playlist").get(verifyJWT, getUserPlaylists);
router.route("/get-playlist/:playlistId").get(verifyJWT, getPlaylistById);
router
  .route("/remove-playlist/:playlistId/:videoId")
  .delete(verifyJWT, removeVideoFromPlaylist);

export default router;
