// *************** IMPORT LIBRARY ***************
const Mongoose = require('mongoose');

// *************** IMPORT MODULE ***************
const CalculationResultModel = require('../modules/calculationResult/calculation_result.model');
const { GenerateTranscriptPdf } = require('../modules/calculationResult/calculation_result.helper');

/**
 * Generate a transcript PDF file for a specific student and return it as a downloadable response.
 * @param request - Express request object containing the student ID in URL parameters.
 * @param response - Express response object used to send back the PDF buffer.
 * @returns {Promise<void>} Sends a PDF buffer as HTTP response.
 * @throws {500} Internal Server Error - If an unexpected error occurs during the process.
 */
async function GenerateTranscriptPdfController(request, response) {
  try {
    // *************** get student's id from url parameter
    const studentId = request?.params?.studentId;

    // *************** check if studentId  is a valid mongoose objectid
    if (!Mongoose.Types.ObjectId.isValid(studentId)) {
      return response.status(400).json({
        status: 400,
        message: 'studentId is required as parameter',
      });
    }

    // *************** get calculation result document via studentId, populate necessarry data
    const populatedCalculationResultDocument = await CalculationResultModel.findOne({ student_id: studentId, status: 'active' })
      .populate({ path: 'student_id', populate: { path: 'school_id' } })
      .populate({ path: 'results.block_id' })
      .populate({ path: 'results.subject_results.subject_id' })
      .populate({ path: 'results.subject_results.test_results.test_id' })
      .lean();

    // *************** sanity check for the populated document
    if (!populatedCalculationResultDocument) {
      return response.status(400).json({
        status: 404,
        message: 'calculation result document not found',
      });
    }

    // *************** call GenerateTranscriptPdf helper to generate the pdf
    const outputPdfFile = await GenerateTranscriptPdf(populatedCalculationResultDocument);
    // *************** set response header
    response.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=${populatedCalculationResultDocument.student_id._id}_${populatedCalculationResultDocument.student_id.last_name}_Transcript_Results.pdf`,
    });
    response.send(outputPdfFile);
  } catch (error) {
    return response.status(500).json({
      status: 500,
      error: error.message,
    });
  }
}

// *************** EXPORT MODULE ***************
module.exports = { GenerateTranscriptPdfController };
