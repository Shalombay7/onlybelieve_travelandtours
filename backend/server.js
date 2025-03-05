require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const multer = require('multer');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MySQL connection
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDFs are allowed'), false);
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Create uploads directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

// Serve static files (for testing uploaded PDFs)
app.use('/uploads', express.static('uploads'));

// Form submission endpoint
app.post('/submit', upload.single('pdf'), async (req, res) => {
    try {
        const { name, email, category } = req.body;
        const pdfPath = req.file ? `/uploads/${req.file.filename}` : null;

        const [result] = await db.execute(
            'INSERT INTO submissions (name, email, category, pdf_path) VALUES (?, ?, ?, ?)',
            [name, email, category, pdfPath]
        );

        res.status(200).json({ message: 'Form submitted successfully', id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error submitting form', error: error.message });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
// ... (existing imports and setup remain unchanged)

// Get all submissions (or a specific one)
app.get('/submissions', async (req, res) => {
    try {
      const [rows] = await db.execute('SELECT * FROM submissions');
      res.status(200).json(rows);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      res.status(500).json({ message: 'Error fetching submissions', error: error.message });
    }
  });
  
  // Get a specific submission by ID (optional)
  app.get('/submissions/:id', async (req, res) => {
    try {
      const [rows] = await db.execute('SELECT * FROM submissions WHERE id = ?', [req.params.id]);
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Submission not found' });
      }
      res.status(200).json(rows[0]);
    } catch (error) {
      console.error('Error fetching submission:', error);
      res.status(500).json({ message: 'Error fetching submission', error: error.message });
    }
  });
  
  // ... (existing /submit endpoint and server start remain unchanged)