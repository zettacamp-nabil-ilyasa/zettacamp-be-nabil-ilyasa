// *************** IMPORT LIBRARY ***************
const Mongoose = require('mongoose');

// *************** IMPORT MODULE ***************
const CalculationResultModel = require('../modules/calculationResult/calculation_result.model');
const { GenerateTranscriptPdf } = require('../modules/calculationResult/calculation_result.helper');

async function GenerateTranscriptPdfController(req, res) {
  try {
    const studentId = req?.params?.studentId;
    if (!Mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        status: 400,
        message: 'studentId is required as parameter',
      });
    }

    const calculationResultDocument = await CalculationResultModel.findOne({ student_id: studentId, status: 'active' });
    if (!calculationResultDocument) {
      return res.status(400).json({
        status: 404,
        message: 'calculation result document not found',
      });
    }

    const outputPdfFile = await GenerateTranscriptPdf;
    res.send(outputPdfFile);
  } catch (error) {
    return res.status(500).json({
      status: 500,
      error: error.message,
    });
  }
}

// *************** EXPORT MODULE ***************
module.exports = { GenerateTranscriptPdfController };
