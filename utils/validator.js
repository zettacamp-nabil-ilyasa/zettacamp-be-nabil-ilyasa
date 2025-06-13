//*************** IMPORT LIBRARY ***************
const mongoose = require('mongoose');

/**
 * Clean input from null, undefined, and empty string.
 * Throws error if any field is null, undefined, or empty string.
 * @param {Object} input - input object to be cleaned.
 * @returns {Object} input - cleaned input object.
 * @throws {Error} if any field is null, undefined, or empty string.
 */
function CleanInputForCreate(input) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new TypeError('Input should be an object');
  }

  const invalidFields = Object.entries(input).filter(
    ([_, value]) => value === null || value === undefined || (typeof value === 'string' && value.trim() === '')
  );

  if (invalidFields.length > 0) {
    const fields = invalidFields.map(([key]) => `"${key}"`).join(', ');
    throw new Error(`This following field cannot be empty: ${fields}`);
  }

  return input;
}

/**
 * Check if id is in valid format
 * @param {string} id - id to be checked
 * @returns {boolean} - true if id is valid, false otherwise
 */
function IdIsValid(id) {
  if (id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return false;
    }
    return true;
  }
  return false;
}
module.exports = { CleanInputForCreate, IdIsValid };
