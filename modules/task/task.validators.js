// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

const { allowedTaskStatus, allowedTaskTypes } = require('../../shared/strings');

/**
 * Validate task filter input
 * @param {Object} filterInput - Object containing filter data
 * @param {Object} filterInput.type - Type of task
 * @param {Object} filterInput.status - Status of task
 */
function ValidateTaskFilterInput(filterInput) {
  // *************** validate type, ensure it is a string and is one of allowed types
  if (filterInput?.type) {
    if (typeof filterInput.type !== 'string') {
      throw new ApolloError('type must be a string');
    }
    if (!allowedTaskTypes.includes(filterInput.type)) {
      throw new ApolloError(`type should be one of following: ${allowedTaskTypes.join(', ')}`);
    }
  }

  // *************** validate status, ensure it is a string and is one of allowed statuses
  if (filterInput?.status) {
    if (typeof filterInput.status !== 'string') {
      throw new ApolloError('status must be a string');
    }
    if (!allowedTaskStatus.includes(filterInput.status)) {
      throw new ApolloError(`status should be one of following: ${allowedTaskStatus.join(', ')}`);
    }
  }
}

/**
 * Validate due_date string
 * @param {String} dueDate - Date in YYYY-MM-DD format
 * @throws {ApolloError} - If due_date is invalid
 */
function ValidateDueDate(dueDate) {
  // *************** only validate due_date if it is provided
  if (dueDate) {
    // *************** check if due_date is a string
    if (typeof dueDate !== 'string') {
      throw new ApolloError('due_date must be a string');
    }

    // *************** validate due_date using regex for YYYY-MM-DD format
    const dueDateRegexPattern = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
    if (!dueDateRegexPattern.test(dueDate)) throw new ApolloError('due_date must be in YYYY-MM-DD format');

    // *************** check if due_date is in the past
    const parsedDate = new Date(dueDate);
    if (isNaN(parsedDate.getTime()) || parsedDate.getTime() < Date.now()) {
      throw new ApolloError('due_date must be in the future');
    }
  }
}

// *************** EXPORT MODULE ***************
module.exports = { ValidateTaskFilterInput, ValidateDueDate };
