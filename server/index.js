import express from "express";
import dotenv from "dotenv"
import connectDb from "./config/connectDb.js";
import cookieParser from "cookie-parser";
dotenv.config()
import cors from "cors"
import authRouter from "./routs/auth.rout.js";
import userRouter from "./routs/user.rout.js";
import interviewRouter from "./routs/interview.rout.js";
import paymentRouter from "./routs/payment.rout.js";


const app = express()
app.use(cors({
    origin:"https://interview-iq-client.onrender.com",
    credentials:true
}))


app.use(express.json())
app.use(cookieParser())


app.use("/api/auth", authRouter)
app.use("/api/user", userRouter)
app.use("/api/interview", interviewRouter)
app.use("/api/payment", paymentRouter)


const PORT = process.env.PORT || 6000
app.listen(PORT, ()=>{
    console.log(`Server  running in port ${PORT}`);
    connectDb()

    
})
