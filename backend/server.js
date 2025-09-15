// File: backend/server.js

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const sharp = require('sharp');
const crypto = require('crypto');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config(); // This is needed for Vercel to read environment variables

const app = express();
const port = process.env.PORT || 3001;

// --- Initialize Gemini ---
// It reads the key from the secure Environment Variable you will set on Vercel.
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-1.5-flash" }) : null;

// --- Middleware ---
app.use(cors()); // Allows your frontend to talk to your backend
app.use(express.json({ limit: '10mb' }));

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG and PNG are allowed.'), false);
    }
  }
});

// --- Core Logic ---

async function immunizeImage(inputBuffer) {
  const image = sharp(inputBuffer);
  const metadata = await image.metadata();
  const { width, height } = metadata;
  const noisePatternSize = 32;
  const noiseBuffer = Buffer.alloc(noisePatternSize * noisePatternSize * 4);
  for (let i = 0; i < noiseBuffer.length; i += 4) {
    const hash = crypto.createHash('sha256').update(String(i)).digest('hex');
    noiseBuffer[i] = parseInt(hash.substring(0, 2), 16);
    noiseBuffer[i+1] = parseInt(hash.substring(2, 4), 16);
    noiseBuffer[i+2] = parseInt(hash.substring(4, 6), 16);
    noiseBuffer[i+3] = 20;
  }
  const noiseOverlay = await sharp(noiseBuffer, { raw: { width: noisePatternSize, height: noisePatternSize, channels: 4 } }).tile({ size: noisePatternSize }).resize(width, height).toBuffer();
  return image.composite([{ input: noiseOverlay, blend: 'over' }]).png().toBuffer();
}

async function analyzeImageWithGemini(imageBuffer, mimeType) {
    if (!model) {
        return {
            piiWarning: "AI analysis is currently disabled by the administrator.",
            deepfakeRisk: "Unknown",
            description: "An image was processed without AI analysis."
        };
    }
    try {
        const prompt = `Analyze this image for potential privacy and security risks if it were to be shared online, specifically in the context of women's safety and stalking. Be concise.
        1.  Check for any visible PII like names, addresses, or license plates.
        2.  Assess its suitability for being used in a deepfake.
        3.  Provide a short, one-sentence summary.
        Return a single, clean JSON object with keys: "piiWarning" (string or null), "deepfakeRisk" ("Low", "Medium", "High"), and "description" (string). Do not wrap in markdown.`;

        const imagePart = { inlineData: { data: imageBuffer.toString("base64"), mimeType } };
        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        return JSON.parse(response.text());

    } catch (error) {
        console.error("Error analyzing image with Gemini:", error);
        return {
            piiWarning: "AI analysis could not be performed. Please check the image manually.",
            deepfakeRisk: "Unknown",
            description: "An image was processed without AI analysis."
        };
    }
}

// --- API Endpoint ---
app.post('/api/immunize', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image file provided.' });
    }
    try {
        const [processedImageBuffer, analysis] = await Promise.all([
            immunizeImage(req.file.buffer),
            analyzeImageWithGemini(req.file.buffer, req.file.mimetype)
        ]);
        res.status(200).json({
            analysis: analysis,
            immunizedImage: `data:image/png;base64,${processedImageBuffer.toString('base64')}`
        });
    } catch (error) {
        res.status(500).json({ error: "An internal server error occurred." });
    }
});

app.listen(port, () => {
  console.log(`AI-Shield server listening on port ${port}`);
});

