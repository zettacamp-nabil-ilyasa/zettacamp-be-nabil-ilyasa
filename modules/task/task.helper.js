// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');
const SendGridMail = require('@sendgrid/mail');

// *************** IMPORT MODULE ***************
const TaskModel = require('./task.model.js');
const UserModel = require('../user/user.model.js');
const TestModel = require('../test/test.model.js');
const SubjectModel = require('../subject/subject.model.js');
const StudentModel = require('../student/student.model.js');
const StudentTestResultModel = require('../studenTestResult/student_test_result.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');

// *************** IMPORT VALIDATOR ***************
const { ValidateMongoObjectId } = require('../../utilities/validators/mongo-validator.js');

/**
 * Create 'enter_marks' tasks for all active students for a given test.
 * @async
 * @param {Object} params - Parameters object.
 * @param {string} params.testId - ID of the test to associate with the tasks.
 * @param {string} params.correctorId - ID of the user who will perform correction.
 * @returns {Promise<void>} - Resolves when all tasks are created.
 * @throws {ApolloError} - If validation or task creation fails.
 */
async function CreateEnterMarksTasks({ testId, userId, dueDate }) {
  try {
    // *************** validate test's id
    ValidateMongoObjectId(testId);

    // *************** validate corrector's id
    ValidateMongoObjectId(userId);

    // *************** get students document
    const students = await StudentModel.find({ status: 'active' }).lean();

    // *************** create task for enter marks for all students
    const enterMarksTasks = students.map((student) => ({
      test_id: testId,
      user_id: userId,
      student_id: student._id,
      type: 'enter_marks',
      status: 'in_progress',
      due_date: dueDate ? new Date(dueDate) : null,
    }));

    // *************** insert tasks to db
    await TaskModel.insertMany(enterMarksTasks);
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'CreateEnterMarksTasks',
      path: '/modules/task/task.helper.js',
      parameter_input: JSON.stringify({}),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Send an email notification to a corrector who has been assigned to a test.
 * @async
 * @param {string} userId - ID of the assigned corrector (User).
 * @param {string} testId - ID of the test being assigned.
 * @param {Date} [dueDate] - Optional due date of the correction task.
 * @returns {Promise<void>} - Resolves if the email is sent successfully.
 * @throws {ApolloError} - Throws error if user, test, or subject is not found, env is missing, or SendGrid fails.
 */
async function SendGridNotificationTrigger({ userId, testId, dueDate }) {
  try {
    // *************** validate user's id
    ValidateMongoObjectId(userId);

    // *************** validate test's id
    ValidateMongoObjectId(testId);

    // *************** get user document
    const user = await UserModel.findOne({ _id: userId, status: 'active' }).lean();
    if (!user) {
      throw new ApolloError('user not found');
    }

    // *************** get test document
    const test = await TestModel.findOne({ _id: testId, status: 'published' }).lean();
    if (!test) {
      throw new ApolloError('test not founnd');
    }

    // *************** get subject document
    const subject = await SubjectModel.findOne({ _id: test.subject_id, status: 'active' }).lean();
    if (!subject) {
      throw new ApolloError('subject not found');
    }

    // *************** get students document
    const students = await StudentModel.find({ status: 'active' }).lean();

    // *************** compose student list
    const studentList = students.map((s) => `- ${s.first_name} ${s.last_name}`).join('\n');

    // *************** set API key
    if (!process.env.SENDGRID_API_KEY || !process.env.SENDER_EMAIL) {
      throw new ApolloError('missing environtment variables: SENDGRID_API_KEY or SENDER_EMAIL ');
    }
    SendGridMail.setApiKey(process.env.SENDGRID_API_KEY);

    // *************** compose message
    const message = {
      to: user.email,
      from: process.env.SENDER_EMAIL,
      subject: 'You have been assigned as a Test Corrector',
      text: `
Hello ${user.first_name},

You have been assigned to correct the test:

Name: ${test.name}
Subject: ${subject.name}
Description: ${test.description}
Due Date: ${dueDate ? new Date(dueDate).toLocaleDateString() : 'N/A'}

List of students whose tests you will be correcting:
${studentList}

Best regards,
Zettabyte System
`,
    };

    // *************** send email
    await SendGridMail.send(message);
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'SendGridNotificationTrigger',
      path: '/modules/task/task.helper.js',
      parameter_input: JSON.stringify({ userId, testId, dueDate }),
    });
    throw new ApolloError(error.message);
  }
}

/**
 * Mark a student test result as validated by updating its status.
 * @async
 * @param {string} studentTestResultId - ID of the student test result to update.
 * @returns {Promise<void>} - Resolves when the status is updated.
 * @throws {ApolloError} - If validation fails or student test result is not found.
 */
async function MarkStudentTestResultAsValidated(studentTestResultId) {
  try {
    // *************** validate student test result id
    ValidateMongoObjectId(studentTestResultId);

    // *************** update student test result document
    const validatedStudentTestResult = await StudentTestResultModel.updateOne(
      { _id: studentTestResultId },
      { $set: { status: 'validated' } }
    );
    if (!validatedStudentTestResult.modifiedCount) {
      throw new ApolloError('student test result not found or already validated');
    }
  } catch (error) {
    await ErrorLogModel.create({
      error_stack: error.stack,
      function_name: 'MarkStudentTestResultAsValidated',
      path: '/modules/task/task.helper.js',
      parameter_input: JSON.stringify({ studentTestResultId }),
    });
    throw new ApolloError(error.message);
  }
}

// *************** EXPORT MODULE ***************
module.exports = { CreateEnterMarksTasks, SendGridNotificationTrigger, MarkStudentTestResultAsValidated };
