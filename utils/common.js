/**
 * Cleans input from null, undefined, and empty string values.
 * @param {Object} input - Input object to be cleaned.
 * @returns {Object} cleanedInput - Cleaned input object.
 */
function CleanInputForUpdate(input) {
  const cleanedInput = Object.fromEntries(
    Object.entries(input).filter(
      ([_, value]) => value !== null && value !== undefined && (typeof value !== 'string' || value.trim() !== '')
    )
  );
  return cleanedInput;
}
// *************** EXPORT MODULE ***************
module.exports = { CleanInputForUpdate };
