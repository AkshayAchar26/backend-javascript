import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import {
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/publish").post(
  verifyJWT,
  upload.fields([
    {
      name: "video",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  publishAVideo
);

router.route("/watch/:videoId").get(getVideoById);

router
  .route("/update-video/:videoId")
  .patch(verifyJWT, upload.single("thumbnail"), updateVideo);

router.route("/delete-video/:videoId").delete(verifyJWT, deleteVideo);

export default router;
