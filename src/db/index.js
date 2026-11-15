import mongoose from "mongoose";
import {DB_NAME} from "../constants.js"

// lets connect the db using mongoose 
const connectDB= async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        // IF WE GET ANY ERROR THEN 
        console.log(`\n MongoDB connected !! DB HOST:${connectionInstance.connection.host}`);
    } catch (eroor) {
        console.log("MONGODB connection error",eroor)
        process.exit(1);// stop the node.js application if you get any error 
        
    }
    
}
export default connectDB;