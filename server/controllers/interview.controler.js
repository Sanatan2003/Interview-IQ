
import fs from "fs";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { askAi } from "../services/openRouter.servic.js";
import User from "../models/userModel.js";
import Interview from "../models/interview.model.js";


export const analyzeResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Resume required" });
    }

    const filepath = req.file.path;
    const fileBuffer = await fs.promises.readFile(filepath);
    const uint8Array = new Uint8Array(fileBuffer);

    const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;

    let resumeText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      resumeText += content.items.map((item) => item.str).join(" ") + "\n";
    }

    resumeText = resumeText.replace(/\s+/g, " ").trim();

    const aiResponse = await askAi([
      {
        role: "system",
        content: `Return JSON:
{
  "role":"string",
  "experience":"string",
  "projects":["project"],
  "skills":["skill"]
}`
      },
      { role: "user", content: resumeText }
    ]);

    let parsed;
    try {
      parsed = JSON.parse(aiResponse);
    } catch {
      throw new Error("AI returned invalid JSON");
    }

    fs.unlinkSync(filepath);

    res.json({
      ...parsed,
      resumeText
    });

  } catch (error) {
    console.error("RESUME ERROR:", error);

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ message: error.message });
  }
};


export const generateQuestion = async (req, res) => {
  try {
    let { role, experience, mode, resumeText, projects, skills } = req.body;

    if (!role || !experience || !mode) {
      return res.status(400).json({
        message: "Role, Experience and Mode required"
      });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.credits < 50) {
      return res.status(400).json({ message: "Minimum 50 credits required" });
    }

    const aiResponse = await askAi([
      {
        role: "system",
        content: "Generate 5 interview questions (one per line)"
      },
      {
        role: "user",
        content: `Role:${role}, Experience:${experience}`
      }
    ]);

    const questionsArray = aiResponse
      .split("\n")
      .map(q => q.trim())
      .filter(Boolean)
      .slice(0, 5);

    user.credits -= 50;
    await user.save();

    const interview = await Interview.create({
      userId: user._id,
      role,
      experience,
      mode,
      resumeText,
      questions: questionsArray.map((q, i) => ({
        question: q,
        difficulty: ["easy","easy","medium","medium","hard"][i],
        timeLimit: [60,60,90,90,120][i]
      }))
    });

    res.json({
      interviewId: interview._id,
      creditsLeft: user.credits,
      userName: user.name,
      questions: interview.questions
    });

  } catch (error) {
    console.error("GENERATE ERROR:", error);
    res.status(500).json({ message: "Failed to create interview" });
  }
};


export const submitAnswer = async (req, res) => {
  try {
    const { interviewId, questionIndex, answer } = req.body;

    const interview = await Interview.findById(interviewId);
    if (!interview) return res.status(404).json({ message: "Not found" });

    const q = interview.questions[questionIndex];

    if (!answer) {
      q.feedback = "No answer submitted";
      q.score = 0;
      await interview.save();
      return res.json({ feedback: q.feedback });
    }

    const aiResponse = await askAi([
      {
        role: "system",
        content: `
Return ONLY valid JSON:
{
  "confidence": number (1-10),
  "communication": number (1-10),
  "correctness": number (1-10),
  "finalScore": number (1-10),
  "feedback": "short feedback"
}`
      },
      {
        role: "user",
        content: `Question: ${q.question}\nAnswer: ${answer}`
      }
    ]);

    let parsed;

    try {
      const cleaned = aiResponse.trim().replace(/```json|```/g, "");
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        confidence: 5,
        communication: 5,
        correctness: 5,
        finalScore: 5,
        feedback: "Evaluation failed. Try again."
      };
    }

    
    const clamp = (v) => Math.max(1, Math.min(10, Number(v) || 5));

    Object.assign(q, {
      answer,
      confidence: clamp(parsed.confidence),
      communication: clamp(parsed.communication),
      correctness: clamp(parsed.correctness),
      score: clamp(parsed.finalScore),
      feedback: parsed.feedback
    });

    await interview.save();

    res.json({
      feedback: q.feedback
    });

  } catch (error) {
    console.error("SUBMIT ERROR:", error);
    res.status(500).json({ message: "Submit failed" });
  }
};


export const finishinterview = async (req, res) => {
  try {
    const { interviewId } = req.body;

    const interview = await Interview.findById(interviewId);
    if (!interview) return res.status(404).json({ message: "Not found" });

    const total = interview.questions.length;

    let score = 0;
    interview.questions.forEach(q => score += Number(q.score) || 0);

    interview.finalScore = total ? score / total : 0;
    interview.status = "completed";

    await interview.save();

    res.json({
      finalScore: interview.finalScore.toFixed(1),
      questionWiseScore: interview.questions
    });

  } catch (error) {
    console.error("FINISH ERROR:", error);
    res.status(500).json({ message: "Finish failed" });
  }
};


export const getMyInterviews = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const interviews = await Interview.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .select("role experience mode finalScore status createdAt");

    res.status(200).json(interviews);

  } catch (error) {
    console.error("GET HISTORY ERROR:", error);
    res.status(500).json({ message: "Failed to fetch interviews" });
  }
};


export const getInterviewReport = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ message: "Not found" });

    const total = interview.questions.length;

    let confidence = 0;
    let communication = 0;
    let correctness = 0;

    interview.questions.forEach((q) => {
      confidence += Number(q.confidence) || 0;
      communication += Number(q.communication) || 0;
      correctness += Number(q.correctness) || 0;
    });

    confidence = total ? confidence / total : 0;
    communication = total ? communication / total : 0;
    correctness = total ? correctness / total : 0;

    res.json({
      finalScore: Number(interview.finalScore) || 0,
      confidence: Number(confidence.toFixed(1)),
      communication: Number(communication.toFixed(1)),
      correctness: Number(correctness.toFixed(1)),
      questionWiseScore: interview.questions
    });

  } catch (error) {
    console.error("REPORT ERROR:", error);
    res.status(500).json({ message: "Report failed" });
  }
};