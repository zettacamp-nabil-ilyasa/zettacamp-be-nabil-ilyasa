// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const { allowedStudentTestResultStatus } = require('../../shared/strings.js');

// *************** IMPORT VALIDATOR ***************
const { ValidateMongoObjectId } = require('../../utilities/validators/mongo-validator.js');

/**
 * Validate optional filter input for fetching student test results.
 * @param {Object} filterInput - Object containing filter data.
 * @param {string} [filterInput.test_id] - Optional test ID to filter by.
 * @param {string} [filterInput.status] - Optional status to filter by.
 * @throws {ApolloError} - If input is invalid.
 */
function ValidateStudentTestResultFilterInput(filterInput) {
  // *************** validate test_id if exist
  if (filterInput?.test_id) {
    ValidateMongoObjectId(filterInput.test_id);
  }

  // *************** validate status if exist
  if (filterInput?.status) {
    if (typeof filterInput.status !== 'string') {
      throw new ApolloError('status must be a string');
    }
    if (!allowedStudentTestResultStatus.includes(filterInput.status)) {
      throw new ApolloError(`status must be one of following: ${allowedStudentTestResultStatus.join(', ')}`);
    }
  }
}

/**
 * Validate marks against the test's notations.
 * @param {Object} params - Parameters object.
 * @param {Array<Object>} params.studentMarks - Array of mark entries.
 * @param {Array<Object>} params.studentMarks.notation_text - notation text of mark.
 * @param {number} params.studentMarks.mark - mark value.
 * @param {string} params.task_id - Test ID to fetch notations from.
 * @throws {ApolloError} - If validation fails.
 */
function ValidateEnterMarksInput({ studentMarks, taskId }) {
  // *************** validate taskId
  ValidateMongoObjectId(taskId);

  // *************** check if marks is provided and is an array
  if (!studentMarks || !Array.isArray(studentMarks)) {
    throw new ApolloError('marks must be an array');
  }

  // *************** validate marks.notation_text and marks.mark
  studentMarks.forEach((studentMark) => {
    if (typeof studentMark.notation_text !== 'string') {
      throw new ApolloError('notation_text must be a string');
    }
    if (typeof studentMark.mark !== 'number') {
      throw new ApolloError('mark must be a number');
    }
    if (studentMark.mark < 0) {
      throw new ApolloError('mark cannot be negative');
    }
  });
}

/**
 * Validate marks against the test's notations.
 * @param {Object} params - Parameters object.
 * @param {Array<Object>} params.studentMarks - Array of mark entries.
 * @param {Array<Object>} params.studentMarks.notation_text - notation text of mark.
 * @param {Array<Object>} params.studentMarks.mark - mark value.
 * @throws {ApolloError} - If validation fails.
 */
function ValidateEnteredMarksInputForUpdate({ studentMarks }) {
  // *************** check if marks is provided and is an array
  if (!studentMarks || !Array.isArray(studentMarks)) {
    throw new ApolloError('marks must be an array');
  }

  // *************** validate marks.notation_text and marks.mark
  studentMarks.forEach((studentMark) => {
    if (typeof studentMark.notation_text !== 'string') {
      throw new ApolloError('notation_text must be a string');
    }
    if (typeof studentMark.mark !== 'number') {
      throw new ApolloError('mark must be a number');
    }
    if (studentMark.mark < 0) {
      throw new ApolloError('mark cannot be negative');
    }
  });
}

// *************** EXPORT MODULE ***************
module.exports = { ValidateStudentTestResultFilterInput, ValidateEnterMarksInput, ValidateEnteredMarksInputForUpdate };
