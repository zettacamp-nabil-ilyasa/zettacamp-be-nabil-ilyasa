// *************** IMPORT LIBRARY ***************
const Express = require('express');

// *************** IMPORT MODULE ***************
const { GenerateTranscriptPdfController } = require('../controller/calculation_result.controller');

const router = Express.Router();

// *************** transcript pdf route
router.get('/api/transcript/pdf/:studentId', GenerateTranscriptPdfController);

// *************** EXPORT MODULE ***************
module.exports = { router };
