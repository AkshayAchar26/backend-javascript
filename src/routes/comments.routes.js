import { Router } from "express";
import {
  getVideoComments,
  addComment,
  updateComment,
  deleteComment,
} from "../controllers/comments.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/get-comments").get(getVideoComments);
router.route("/add-comments").post(verifyJWT, addComment);
router.route("/update-comments").patch(verifyJWT, updateComment);
router.route("/delete-comments").delete(verifyJWT, deleteComment);

export default router;
