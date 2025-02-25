import { S3Client } from "@aws-sdk/client-s3";
import multer from "multer";
import multerS3 from "multer-s3";
import sharp from "sharp";
import dotenv from "dotenv";
import { PassThrough } from "stream";

dotenv.config();

// Initialize S3 Client
const s3 = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
  }
});

// Multer Storage Configuration
const storage = multerS3({
  s3: s3,
  bucket: process.env.AWS_BUCKET_NAME,
  contentType: multerS3.AUTO_CONTENT_TYPE, // Auto-detect content type
  metadata: (req, file, cb) => {
    cb(null, { fieldName: file.fieldname });
  },
  key: (req, file, cb) => {
    cb(null, `avatar/${Date.now()}-compressed-${file.originalname}`);
  },
  shouldTransform: true,
  transforms: [
    {
      id: "resized",
      key: (req, file, cb) => {
        cb(null, `avatar/${Date.now()}-compressed-${file.originalname}`);
      },
      transform: (req, file, cb) => {
        const transformer = sharp()
          .resize(500, 500, { fit: "inside" }) // Resize to max 500x500, maintain aspect ratio
          .toFormat("jpeg") // Convert to JPEG
          .jpeg({ quality: 50 }) // Reduce JPEG quality to 50%
          .flatten({ background: "#ffffff" }) // Convert transparent PNGs to white background
          .toBuffer((err, buffer) => {
            if (err) return cb(err);
            const passthrough = new PassThrough();
            passthrough.end(buffer);
            cb(null, passthrough);
          });
      }
    }
  ]
});

// Multer Upload Middleware
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 2MB max file size limit
});

export { upload };
