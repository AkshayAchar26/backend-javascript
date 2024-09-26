import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    // const connectionInstance = await mongoose.connect(
    //   `${process.env.MONGODB_URL}/${DB_NAME}`
    // );

    const connectionInstance = await mongoose.connect(
      'mongodb://localhost:27017/mydb'
    )
    console.log("MongoDB connected !! ", connectionInstance.connection.host);
  } catch (error) {
    console.log("MongoDB connection FAILED! : ", error);
    process.exit(1);
  }
};

export default connectDB;
