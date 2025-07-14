// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

/**
 *
 * @param {Object} inputObject - Object containing filter data
 * @param {Object} inputObject.type - Type of task
 * @param {Object} inputObject.status - Status of task
 */
function ValidateTaskFilterInput(inputObject) {
  if (inputObject?.type) {
    if (typeof inputObject.type !== 'string') {
      throw new ApolloError('type must be a string');
    }
    const types = ['assign_corrector', 'validate_marks', 'enter_marks'];
    if (!types.includes(inputObject.type)) {
      throw new ApolloError(`type should be one of following: ${types.join(', ')}`);
    }
  }

  if (inputObject?.status) {
    if (typeof inputObject.status !== 'string') {
      throw new ApolloError('status must be a string');
    }
    const statuses = ['pending', 'in_progress', 'completed'];
    if (!statuses.includes(inputObject.status)) {
      throw new ApolloError(`status should be one of following: $statuses.join(', )`);
    }
  }
}

/**
 * Validate due_date string
 * @param {String} dueDate - Date in YYYY-MM-DD format
 * @throws {ApolloError} - If due_date is invalid
 */
function ValidateDueDate(dueDate) {
  if (dueDate) {
    // *************** check if due_date is a string
    if (typeof dueDate !== 'string') {
      throw new ApolloError('due_date must be a string');
    }

    // *************** validate due_date
    const dueDateRegexPatern = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
    if (!dueDateRegexPatern.test(dueDate)) throw new ApolloError('due_date must be in YYYY-MM-DD format');

    // *************** check if due_date is in the past
    const parsedDate = new Date(dueDate);
    if (isNaN(parsedDate.getTime()) || parsedDate.getTime() < Date.now()) {
      throw new ApolloError('due_date must be in the future');
    }
  }
}

// *************** EXPORT MODULE ***************
module.exports = { ValidateTaskFilterInput, ValidateDueDate };
