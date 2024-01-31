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
    // console.log(response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    return null;
  }
};

const deletFromCloudinary = async (pathUrl, option = {}) => {
  let url = pathUrl.match(/\/sp_auto\//) || false;
 
  if (url) {
    return true;
  }

  const urlArray = pathUrl.match(/\/([^\/]+)\.(m3u8|mp4|jpeg|jpg)$/);

  if (!urlArray && !urlArray[1]) {
    throw new ApiErrors(404, "somthing went wrong in public_id");
  }

  const public_id = urlArray[1];

  console.log(public_id);

  try {
    const response = await cloudinary.uploader
      .destroy(public_id, option)
      .then((result) => {
        if (result.result === "ok") {
          console.log(result);
          return true;
        } else {
          return false;
        }
      });

    return response;
  } catch (error) {
    return null;
  }
};

export { uploadToCloudinary, deletFromCloudinary };
