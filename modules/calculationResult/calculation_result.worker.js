// *************** IMPORT LIBRARY ***************
const { workerData, parentPort } = require('worker_threads');
const Mongoose = require('mongoose');

// *************** IMPORT MODULE ***************
const { DB_NAME, DB_HOST } = require('../../core/config');
const { CalculateResult } = require('./calculation_result.helper');

/**
 * Worker thread to calculate transcript result for a student.
 * Connects to MongoDB and runs the `CalculateResult` function for the provided student ID.
 * Sends result back to parent thread via `parentPort.postMessage`.
 */
async function CalculateResultWorker() {
  try {
    // *************** sanity check for the config variables
    if (!DB_NAME || !DB_HOST) {
      throw new Error('DB_NAME or DB_HOST is missing');
    }

    // *************** construct mongodburi for db connection
    const mongoDbUri = `mongodb://${DB_HOST}/${DB_NAME}`;
    await Mongoose.connect(mongoDbUri);

    // *************** deconstruct parameter
    const { studentId } = workerData;

    // *************** call the helper function
    await CalculateResult(studentId);
    parentPort.postMessage({ success: true });
  } catch (error) {
    parentPort.postMessage({ success: false, error: error.message });
  }
}

// *************** run the helper function
CalculateResultWorker();
