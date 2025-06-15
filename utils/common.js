/**
 * Cleans input from null, undefined, and empty string values (shallow only).
 * @param {Object} input - Input object to be cleaned.
 * @returns {Object} cleanedInput - Cleaned input object.
 */
function CleanNonRequiredInput(input) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new TypeError('Input should be an object');
  }
  const cleanedInput = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === null || value === undefined) {
      continue;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed !== '') {
        cleanedInput[key] = trimmed;
      }
    } else {
      cleanedInput[key] = value;
    }
  }
  return cleanedInput;
}

// *************** EXPORT MODULE ***************
module.exports = { CleanNonRequiredInput };
