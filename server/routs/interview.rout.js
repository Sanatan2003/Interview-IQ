import express from "express"
import isAuth from "../middleware/isAuth.js"
import { upload } from "../middleware/multer.js"
import { analyzeResume, finishinterview, generateQuestion, getInterviewReport, getMyInterviews, submitAnswer } from "../controllers/interview.controler.js"



const interviewRouter = express.Router()

interviewRouter.post("/resume", isAuth,upload.single("resume"),analyzeResume)
interviewRouter.post("/generate-questions",isAuth,generateQuestion)
interviewRouter.post("/submit-answer",isAuth,submitAnswer)
interviewRouter.post("/finish",isAuth,finishinterview)


interviewRouter.get("/get-interview",isAuth,getMyInterviews)
interviewRouter.get("/report/:id",isAuth,getInterviewReport)


export default interviewRouter