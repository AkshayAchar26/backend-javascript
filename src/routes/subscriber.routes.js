import { Router } from "express";
import {
  toggleSubscription,
  getUserChannelSubscribers,
  getSubscribedChannels,
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/toggle-sub/:channelId").post(verifyJWT, toggleSubscription);
router.route("/get-sub/:channelId").get(verifyJWT, getUserChannelSubscribers);
router
  .route("/get-channel/:subscriberId")
  .get(verifyJWT, getSubscribedChannels);

export default router;
