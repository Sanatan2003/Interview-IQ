
import Payment from "../models/payment.model.js";
import User from "../models/userModel.js";
import razorpay from "../services/razorpay.servic.js";
import crypto from "crypto";


export const createOrder = async (req, res) => {
  try {
    const { planId, amount, credits } = req.body;

    if (!amount || !credits) {
      return res.status(400).json({
        message: "Invalid plan data",
      });
    }

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`, // ✅ FIXED
    };

    const order = await razorpay.orders.create(options);

    await Payment.create({
      userId: req.userId,
      planId,
      amount,
      credits,
      razorpayOrderId: order.id,
      status: "created",
    });

    res.json(order);
  } catch (error) {
    console.error("CREATE ORDER ERROR:", error); // ✅ important
    return res.status(500).json({
      message: "Failed to create Razorpay order",
      error: error.message,
    });
  }
};


export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        message: "Invalid payment signature",
      });
    }

    // ✅ FIX: renamed variable
    const existingPayment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
    });

    if (!existingPayment) {
      return res.status(400).json({ message: "Payment not found" });
    }

    if (existingPayment.status === "paid") {
      return res.json({ message: "Already processed" });
    }

    existingPayment.status = "paid";
    existingPayment.razorpayPaymentId = razorpay_payment_id;
    await existingPayment.save();

    const updatedUser = await User.findByIdAndUpdate(
      existingPayment.userId,
      {
        $inc: { credits: existingPayment.credits },
      },
      { new: true }
    );

    res.json({
      success: true,
      message: "Payment verified and credits added",
      user: updatedUser,
    });
  } catch (error) {
    console.error("VERIFY ERROR:", error); 
    return res.status(500).json({
      message: "Failed to verify Razorpay payment",
      error: error.message,
    });
  }
};