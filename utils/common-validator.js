//*************** IMPORT LIBRARY ***************
const mongoose = require('mongoose');

//*************** IMPORT MODULE ***************
const UserModel = require('../graphql/user/user.model.js');

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
  //*************** input check
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new TypeError('Input should be an object');
  }
  //*************** create new object
  const cleanedInput = {};

  for (const [key, value] of Object.entries(input)) {
    //*************** check for null and undefined
    if (value === null || value === undefined) {
      throw new Error(`${key} is required`);
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      //*************** if it's an empty string and it's not a non-mandatory field, assign the trimmed value
      if (trimmed === '') {
        if (!nonMandatoryFields.includes(key)) {
          cleanedInput[key] = trimmed;
        } else {
          throw new Error(`${key} is required`);
        }
        //*************** if it's not an empty string, assign the trimmed value
      } else {
        cleanedInput[key] = trimmed;
      }
      //*************** if it's not a string, assign the value
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
  //*************** check if id is not a string
  if (typeof id !== 'string') {
    throw new Error('Invalid id input');
  }
  const trimmedId = id.trim();
  //*************** check if id is empty and not an object id
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
    //*************** userId input check
    const validatedUserId = SanitizeAndValidateId(userId);
    //*************** set query for db operation
    const query = { _id: validatedUserId, roles: 'admin' };
    const count = await UserModel.countDocuments(query);
    const userIsAdmin = count > 0;
    return userIsAdmin;
  } catch (error) {
    throw new Error(error.message);
  }
}

//*************** EXPORT MODULE ***************
module.exports = { CleanRequiredInput, SanitizeAndValidateId, UserIsAdmin };
