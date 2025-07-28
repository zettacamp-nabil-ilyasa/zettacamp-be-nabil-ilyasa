// *************** IMPORT LIBRARY ***************
const Express = require('express');

// *************** IMPORT MODULE ***************
const { GenerateTranscriptPdf } = require('../modules/calculationResult/calculation_result.helper');

const router = Express.Router();

// *************** transcript pdf route
router.get('/api/transcript/pdf/:studentId', GenerateTranscriptPdf);

// *************** EXPORT MODULE ***************
module.exports = { router };
