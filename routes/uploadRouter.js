const express = require('express');
const bodyParser = require('body-parser');
const authenticate = require('../authenticate');
const multer = require('multer');
const cors = require('./cors');
// https://code.tutsplus.com/tutorials/file-upload-with-multer-in-node--cms-32088
// multer avec mongoDB
// https://www.npmjs.com/package/multer

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images');
    },

    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
});

const imageFileFilter = (req, file, cb) => {
    if(!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return cb(new Error('You can upload only image files!'), false);
    }
    cb(null, true);
};

const upload = multer({ storage: storage, fileFilter: imageFileFilter});

const uploadRouter = express.Router();

uploadRouter.use(bodyParser.json());

// for all endpoint --> authenticate.verifyUser, authenticate.verifyAdmin, 
uploadRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })

.get( cors.cors, (req, res, next) => {
    res.statusCode = 403;
    res.end('GET operation not supported on /imageUpload');
})
.post( cors.corsWithOptions, upload.single('imageFile'), (req, res) => { // post actif amis pas associé a mongoDB
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    console.log('req.file' , req.file);
    res.json(req.file);
    
})
.put((req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /imageUpload');
})
.delete( (req, res, next) => {
    res.statusCode = 403;
    res.end('DELETE operation not supported on /imageUpload');
});

module.exports = uploadRouter;