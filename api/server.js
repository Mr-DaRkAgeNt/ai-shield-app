const express = require('express');
const cors = require('cors');
const multer = require('multer');
const sharp = require('sharp');
const crypto = require('crypto');

const app = express();
const port = 3001;

// --- Middleware ---
// Allows your frontend (running on a different port) to communicate with this backend
app.use(cors()); 
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

// --- Core Image "Armoring" Logic ---
async function immunizeImage(inputBuffer) {
  const image = sharp(inputBuffer);
  const metadata = await image.metadata();
  const { width, height } = metadata;

  // Create a subtle, deterministic noise pattern
  const noisePatternSize = 32;
  const noiseBuffer = Buffer.alloc(noisePatternSize * noisePatternSize * 4);
  for (let i = 0; i < noiseBuffer.length; i += 4) {
    const hash = crypto.createHash('sha256').update(String(i)).digest('hex');
    noiseBuffer[i] = parseInt(hash.substring(0, 2), 16);     // Red
    noiseBuffer[i+1] = parseInt(hash.substring(2, 4), 16); // Green
    noiseBuffer[i+2] = parseInt(hash.substring(4, 6), 16); // Blue
    noiseBuffer[i+3] = 20; // Low alpha (transparency) to make the noise subtle
  }

  const noiseOverlay = await sharp(noiseBuffer, { 
    raw: { width: noisePatternSize, height: noisePatternSize, channels: 4 } 
  }).tile({ size: noisePatternSize }).resize(width, height).toBuffer();
  
  // Composite the noise over the original image and return it as a PNG buffer
  return image.composite([{ input: noiseOverlay, blend: 'over' }]).png().toBuffer();
}

// --- The Single API Endpoint ---
app.post('/api/immunize', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image file provided.' });
    }
    try {
        const processedImageBuffer = await immunizeImage(req.file.buffer);
        
        // Send the new, armored image back to the frontend as a base64 string
        res.status(200).json({
            immunizedImage: `data:image/png;base64,${processedImageBuffer.toString('base64')}`
        });
    } catch (error) {
        console.error("Error processing image:", error);
        res.status(500).json({ error: "An internal server error occurred during image processing." });
    }
});

app.listen(port, () => {
  console.log(`AI-Shield server listening on http://localhost:${port}`);
});
