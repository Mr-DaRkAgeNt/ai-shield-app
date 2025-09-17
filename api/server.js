const express = require('express');
const cors = require('cors');
const multer = require('multer');
const sharp = require('sharp');
const crypto = require('crypto');
const fs = require('fs');

// --- Load Configuration ---
// This line reads your new config.json file.
const config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

const app = express();
const port = config.server.port || 3001;

// --- Middleware ---
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  // Use settings from config.json
  limits: { fileSize: config.imageProcessing.fileSizeLimitMB * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    // Use settings from config.json
    if (config.imageProcessing.allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type based on config.json.'), false);
    }
  }
});

// --- Core Image "Armoring" Logic ---
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
  const noiseOverlay = await sharp(noiseBuffer, { 
    raw: { width: noisePatternSize, height: noisePatternSize, channels: 4 } 
  }).tile({ size: noisePatternSize }).resize(width, height).toBuffer();
  
  return image.composite([{ input: noiseOverlay, blend: 'over' }]).png().toBuffer();
}

// --- API Endpoint ---
app.post('/api/immunize', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image file provided.' });
    }
    try {
        let finalImageBuffer = req.file.buffer;

        // Use the "enabled" setting from config.json
        if (config.immunizer.enabled) {
            finalImageBuffer = await immunizeImage(req.file.buffer);
        }
        
        res.status(200).json({
            immunizedImage: `data:image/png;base64,${finalImageBuffer.toString('base64')}`
        });
    } catch (error) {
        console.error("Error processing image:", error);
        res.status(500).json({ error: "An internal server error occurred." });
    }
});

app.listen(port, () => {
  console.log(`AI-Shield server listening on http://localhost:${port}`);
});
