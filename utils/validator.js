//*************** IMPORT LIBRARY ***************
const mongoose = require('mongoose');

//*************** IMPORT MODULE ***************
const User = require('../graphql/user/user.model.js');

//*************** list of non-mandatory fields
const nonMandatoryFields = ['address', 'date_of_birth'];
/**
 * Clean input from null, undefined, and empty string (shallow only).
 * Throws error if any field is null, undefined, or empty string.
 * @param {Object} input - input object to be cleaned.
 * @returns {Object} input - cleaned input object.
 * @throws {Error} if any field is null, undefined, or empty string.
 */
function CleanRequiredInput(input) {
  //*************** sanity check
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
      //*************** if it's an empty string and it's not a non-mandatory field, assign the trimmed value, otherwise throw error
      if (trimmed === '') {
        if (!nonMandatoryFields.includes(key)) {
          cleanedInput[key] = trimmed;
        } else {
          throw new Error(`${key} is required`);
        }
      } else {
        cleanedInput[key] = trimmed;
      }
      //*************** if it's not an empty string, assign the trimmed value
    } else {
      cleanedInput[key] = value;
    }
  }
  return cleanedInput;
}

/**
 * Check if id is in valid format.
 * @param {string} id - id to be checked.
 * @returns {string} - Trimmed and validated object id.
 * @throws {Error} - If failed in sanity check.
 */
function SanitizeAndValidateId(id) {
  //*************** sanity check
  if (typeof id !== 'string') {
    throw new Error('Invalid id input');
  }
  const trimmedId = id.trim();
  if (trimmedId === '' || !mongoose.Types.ObjectId.isValid(trimmedId)) {
    throw new Error('Invalid id input');
  }
  return trimmedId;
}

/**
 * Checks if a user is exist and has admin role.
 * @param {string} userId - The ID of the user to validate.
 * @returns {Promise<boolean>} - True if user has admin role, false otherwise.
 * @throws {Error} - If failed in sanity check or db operation.
 */
async function UserIsAdmin(userId) {
  try {
    //*************** sanity check
    if (typeof userId !== 'string') {
      throw new Error('Invalid user id input');
    }
    const trimmedUserId = userId.trim();
    if (trimmedUserId === '' || !mongoose.Types.ObjectId.isValid(trimmedUserId)) {
      throw new Error('Invalid user id input');
    }
    const query = await User.countDocuments({ _id: trimmedUserId, roles: 'admin' });
    const count = query > 0;
    return count;
  } catch (error) {
    throw new Error(error.message);
  }
}

//*************** EXPORT MODULE ***************
module.exports = { CleanRequiredInput, SanitizeAndValidateId, UserIsAdmin };
