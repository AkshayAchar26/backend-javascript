import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiErrors } from "./ApiErrors.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    return null;
  }
};

const deleteFromCloudinary = async (pathUrl, option = {}) => {
  if (pathUrl.match(/\/sp_auto\//)) return true;

  const urlArray = pathUrl.match(/\/([^\/]+)\.(m3u8|mp4|jpeg|jpg|png)$/);

  if (!urlArray && !urlArray[1]) {
    throw new ApiErrors(404, "somthing went wrong in public_id");
  }

  const public_id = urlArray[1];

  try {
    const response = await cloudinary.uploader
      .destroy(public_id, option)
      .then((result) => result.result === "ok");

    return response;
  } catch (error) {
    return null;
  }
};

export { uploadToCloudinary, deleteFromCloudinary };
