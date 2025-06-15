//*************** IMPORT LIBRARY ***************
const mongoose = require('mongoose');

//*************** IMPORT MODULE ***************
const User = require('../graphql/user/user.model.js');
/**
 * Clean input from null, undefined, and empty string (shallow only).
 * Throws error if any field is null, undefined, or empty string.
 * @param {Object} input - input object to be cleaned.
 * @returns {Object} input - cleaned input object.
 * @throws {Error} if any field is null, undefined, or empty string.
 */
function CleanRequiredInput(input) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new TypeError('Input should be an object');
  }
  const cleanedInput = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === null || value === undefined) {
      throw new Error(`${key} is required`);
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '') {
        throw new Error(`${key} is required`);
      }
      cleanedInput[key] = trimmed;
    } else {
      cleanedInput[key] = value;
    }
  }
  return cleanedInput;
}

/**
 * Check if id is in valid format
 * @param {string} id - id to be checked
 * @returns {string} - Trimmed and validated object id
 * @throws {Error} - If id is not valid
 */
function SanitizeAndValidateId(id) {
  if (typeof id !== 'string') {
    throw new Error('Invalid ID');
  }
  const trimmed = id.trim();
  if (!mongoose.Types.ObjectId.isValid(trimmed)) {
    throw new Error('Invalid ID');
  }
  return trimmed;
}

/**
 * Checks if a user has admin role.
 * @param {string} userId - The ID of the user to validate.
 * @returns {Promise<boolean>} - True if user has admin role, false otherwise.
 */
async function UserIsAdmin(userId) {
  try {
    const query = await User.countDocuments({ _id: userId, roles: 'admin' });
    const count = query > 0;
    return count;
  } catch (error) {
    throw new Error(error.message);
  }
}

module.exports = { CleanRequiredInput, SanitizeAndValidateId, UserIsAdmin };
