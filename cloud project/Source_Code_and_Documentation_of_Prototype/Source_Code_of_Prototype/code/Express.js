const express = require('express');
const multer = require('multer');
const { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions } = require('@azure/storage-blob');
const app = express();
const upload = multer();

app.use(express.static('public'));

// Azure Storage connection string and container name
const AZURE_STORAGE_CONNECTION_STRING = 'DefaultEndpointsProtocol=https;AccountName=server2team2;AccountKey=0iTjk4vgxO2IyhQ3hawAFzqjly3axKVIZfFcnwDQU15rKC2YwZNhwMRBPh/BOMz0lSwcmyJqdZ11+AStX56mTg==;EndpointSuffix=core.windows.net    ';
const containerName = 'server2team2files';

app.post('/upload-to-azure', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            throw new Error('No file uploaded.');
        }

        const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blobName = req.file.originalname;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        // Set the contentType for the blob
        const uploadOptions = {
            blobHTTPHeaders: {
                blobContentType: req.file.mimetype, // Dynamically set MIME type
            },
        };

        await blockBlobClient.upload(req.file.buffer, req.file.size, uploadOptions);

        // Generate a SAS token for the uploaded blob
        const sasToken = generateBlobSASQueryParameters({
            containerName,
            blobName,
            permissions: BlobSASPermissions.parse("r"), // Grant read permissions
            startsOn: new Date(new Date().valueOf() - 3600 * 1000), // Optional: SAS starts 1 hour ago
            expiresOn: new Date(new Date().valueOf() + 24 * 3600 * 1000), // SAS expires in 24 hours
        }, blobServiceClient.credential).toString();

        // Construct the SAS URL for the blob
        const blobUrlWithSAS = `${blockBlobClient.url}?${sasToken}`;

        // Respond with the URL of the uploaded file with SAS token
        res.json({ message: `File uploaded successfully to Azure Blob Storage.`, url: blobUrlWithSAS });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).send(error.message);
    }
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Server running on port ${port}`));
