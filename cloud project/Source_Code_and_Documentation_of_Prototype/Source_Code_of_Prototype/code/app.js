require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');

const app = express();
app.use(express.static('public'));
const upload = multer({ storage: multer.memoryStorage() });
const storage = new Storage({ keyFilename: '' });
const bucket = storage.bucket('');

// Endpoint to handle file uploads
app.post('/upload', upload.single('file'), (req, res, next) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    // Create a new blob in the bucket and upload the file data.
    const blob = bucket.file(req.file.originalname);
    const blobStream = blob.createWriteStream({
        resumable: false,
    });

    blobStream.on('error', err => next(err));

    // blobStream.on('finish', () => {
    //     // The public URL can be used to directly access the file via HTTP.
    //     const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
    //     res.status(200).send({ message: 'File uploaded successfully.', url: publicUrl });
    // });
    blobStream.on('finish', () => {
        // Generate a signed URL for temporary access to the file
        const config = {
            action: 'read',
            expires: '03-17-2025', // or any appropriate date
        };
    
        blob.getSignedUrl(config, (err, url) => {
            if (err) {
                next(err);
                return;
            }
            res.status(200).send({ message: 'File uploaded successfully.', url: url });
        });
    });
    

    blobStream.end(req.file.buffer);
});

const port = 3000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
