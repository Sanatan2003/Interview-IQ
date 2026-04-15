import mongoose from "mongoose";

const connectDb = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL)
        console.log(" Database connect ");
        
        
    } catch (error) {
        console.log(` DataBase error ${error}`);
        
        
    }
}
export default connectDb