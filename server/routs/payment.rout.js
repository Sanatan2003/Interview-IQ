import express from "express"
import isAuth from "../middleware/isAuth.js"
import { createOrder, verifyPayment } from "../controllers/payment.controler.js"



const paymentRouter = express.Router()

paymentRouter.post("/order", isAuth, createOrder)
paymentRouter.post("/verify", isAuth, verifyPayment)





export default paymentRouter