import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Subscription } from "../models/subscription.model.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiErrors(401, "User should be logged in");
  }

  try {
    const subscription = await Subscription.findOneAndDelete({
      $and: [{ subscriber: userId }, { channel: channelId }],
    });

    let newSubscriber;
    if (!subscription) {
      newSubscriber = await Subscription.create({
        subscriber: userId,
        channel: channelId,
      });

      return res
        .status(200)
        .json(new ApiResponse(newSubscriber, 200, "Subscribed successfully"));
    } else {
      return res
        .status(200)
        .json(new ApiResponse({}, 200, "Unsubscribed successfully"));
    }
  } catch (error) {
    throw new ApiErrors(500, "Somthing went wrong while subscribe/unsubscribe");
  }
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!channelId) throw new ApiErrors(404, "channel id is required");

  try {
    const users = await Subscription.aggregate([
      {
        $match: {
          channel: channelId,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "channel",
          foreignField: "_id",
          as: "subscriberInfo",
        },
      },
      {
        $unwind: "$subscriberInfo",
      },
      {
        $project: {
          username: "$subscriberInfo.username",
        },
      },
    ]);

    return res
      .status(200)
      .json(new ApiResponse(users, 200, "Successfully retrieved information"));
  } catch (error) {
    throw new ApiErrors(
      500,
      "somthing went worng while retrieving sunscribers list",
      error
    );
  }
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!subscriberId) throw new ApiErrors(404, "subscriber id is required");

  try {
    const channels = await Subscription.aggregate([
      {
        $match: {
          subscriber: subscriberId,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "subscriber",
          foreignField: "_id",
          as: "channelInfo",
        },
      },
      {
        $unwind: "$channelInfo",
      },
      {
        $project: {
          channelName: "$channelInfo.username",
        },
      },
    ]);

    return res
      .status(200)
      .json(
        new ApiResponse(channels, 200, "Successfully retrieved information")
      );
  } catch (error) {
    throw new ApiErrors(
      500,
      "Somthing went wrong while getting channel details",
      error
    );
  }
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
