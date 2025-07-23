// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');
const Mongoose = require('mongoose');

// *************** IMPORT MODULE ***************
const CalculationResultModel = require('./calculation_result.model.js');
const StudentTestResultModel = require('../studentTestResult/student_test_result.model.js');
const BlockModel = require('../../modules/block/block.model.js');
const SubjectModel = require('../../modules/subject/subject.model.js');
const TestModel = require('../../modules/test/test.model.js');

// *************** IMPORT VALIDATOR ***************
const { ValidateMongoObjectId } = require('../../utilities/validators/mongo-validator.js');

/**
 * Calculate result for all blocks, subjects, and tests that related with student_test_result documents that contain studentId
 * This function groups student test results by block and computes all needed fields for calculation result,
 * @param {String} studentId - Student's id to filter the populated documents
 * @returns {Promise<void>} - Returns nothing
 * @throws {Error} - if any error occured within try block
 */
async function CalculateResult(studentId) {
  try {
    // *************** validate student's id
    ValidateMongoObjectId(studentId);

    // *************** get populated student test results documents using student's id as filterclea
    const populatedStudentTestResults = await StudentTestResultModel.find({ student_id: studentId, status: 'validated' })
      .populate({
        path: 'test_id',
        populate: { path: 'subject_id', populate: { path: 'block_id' } },
      })
      .lean();

    const groupedDocumentsByBlock = {};
    // *************** START: Grouping populated data by block ***************
    for (const result of populatedStudentTestResults) {
      // *************** store block's and subject's id
      const block = result.test_id.subject_id?.block_id;
      const subject = result.test_id?.subject_id;

      // *************** convert the ids into a string
      const blockId = String(block._id);
      const subjectId = String(subject._id);

      // *************** check if there's already a field made with the block's document
      if (!groupedDocumentsByBlock[blockId]) {
        // *************** add the block into the groupedDocumentsByBlock object if none
        groupedDocumentsByBlock[blockId] = {
          block: block,
          subjects: {},
        };
      }

      // *************** check if there's already a field made with the subject's document
      if (!groupedDocumentsByBlock[blockId].subjects[subjectId]) {
        // *************** add the subject into the groupedDocumentsByBlock object if none
        groupedDocumentsByBlock[blockId].subjects[subjectId] = {
          subject: subject,
          results: [],
        };
      }

      // *************** insert the populated student test results into the results field within the mapped object
      groupedDocumentsByBlock[blockId].subjects[subjectId].results.push(result);
    }
    // *************** END: Store the grouping result into grouppedDocumentsByBlock ***************

    // *************** START: Construct data for calculation_result model ***************
    const calculationResultObjects = [];

    // *************** create an array out of grouppedDocumentsByBlock
    const arrayedDocuments = Object.entries(groupedDocumentsByBlock);

    // *************** start a loop to construct payload
    for (const [blockId, blockData] of arrayedDocuments) {
      // *************** set up a base payload object
      const calculationResultPayload = {
        block_id: blockId,
        block_result: undefined,
        subject_results: [],
      };
      let totalOfSubjectsMarks = 0;

      // *************** start another loop for payload's subject results
      for (const [subjectId, subjectData] of Object.entries(blockData.subjects)) {
        let totalWeightedMarks = 0;
        const testResultsForCalculationResultPayload = [];

        // *************** start another loop for test processing within subject
        for (const result of subjectData.results) {
          // *************** calculate the test result's weighted marks
          const weightedMark = Number((result.average_mark * result.test_id.weight).toFixed(2));

          // *************** add the weightedMark to outer variable
          totalWeightedMarks += weightedMark;

          const testScopeEvaluatedCondition = CalculateTestResult({ testPassCondition: result.test_id.pass_condition, weightedMark });
          let testResult;
          if (testScopeEvaluatedCondition === true) {
            testResult = 'pass';
          } else if (testScopeEvaluatedCondition === false) {
            testResult = 'fail';
          }

          // *************** push test results to outer variable
          testResultsForCalculationResultPayload.push({
            test_id: result.test_id._id,
            test_result: testResult,
            average_mark: result.average_mark,
            weighted_mark: weightedMark,
          });
        }
        // *************** calculate subject's total mark
        const subjectTotalMark = Number(((totalWeightedMarks / subjectData.results.length) * subjectData.subject.coefficient).toFixed(2));

        // *************** compose a subject scope payload object
        const subjectScopeCalculationResultPayload = {
          subject_id: subjectId,
          total_marks: subjectTotalMark,
          test_results: testResultsForCalculationResultPayload,
        };

        // *************** add the subject's total mark to outer variable
        totalOfSubjectsMarks += subjectTotalMark;

        // *************** call helper to calculate subject_result
        const subjectScopeEvaluatedConditions = CalculateSubjectResult({
          subjectPassConditions: subjectData.subject.pass_conditions,
          subjectCalculationResultPayload: subjectScopeCalculationResultPayload,
        });

        // *************** set conditions to assign the subject_result value
        if (subjectScopeEvaluatedConditions === true) {
          subjectScopeCalculationResultPayload.subject_result = 'pass';
        } else if (subjectScopeEvaluatedConditions === false) {
          subjectScopeCalculationResultPayload.subject_result = 'fail';
        }
        // *************** push subject's local payload to calculationResultPayload outside
        calculationResultPayload.subject_results.push(subjectScopeCalculationResultPayload);
      }

      // *************** calculate the total marks for block
      calculationResultPayload.total_marks = Number((totalOfSubjectsMarks / Object.keys(blockData.subjects).length).toFixed(2));
      const blockScopeEvaluatedConditions = CalculateBlockResult({
        blockPassConditions: blockData.block.pass_conditions,
        calculationResultPayload: calculationResultPayload,
      });

      // *************** set conditions to assign the block_result value
      if (blockScopeEvaluatedConditions === true) {
        calculationResultPayload.block_result = 'pass';
      } else if (blockScopeEvaluatedConditions === false) {
        calculationResultPayload.block_result = 'fail';
      }
      // *************** push block's payload into calculationResultObjects array
      calculationResultObjects.push(calculationResultPayload);
    }

    // *************** set logic for overall_result, return true if every blocks, subjects, and tests result is pass
    const overallResult = calculationResultObjects.every((block) => {
      if (block.block_result !== 'pass') return false;
      return block.subject_results.every((subject) => {
        if (subject.subject_result !== 'pass') return false;
        return subject.test_results.every((test) => test.test_result === 'pass');
      });
    });
    // *************** END: Constructed data passed into calculationResult object ***************

    // *************** payload for inserting data into calculation result models
    const calculationResult = {
      student_id: studentId,
      overall_result: overallResult ? 'pass' : 'fail',
      results: calculationResultObjects,
    };

    // *************** update calculation result document if it exists, create a new one otherwise
    const existedResultData = await CalculationResultModel.findOne({ student_id: studentId });
    if (!existedResultData) {
      await CalculationResultModel.create(calculationResult);
    } else {
      await CalculationResultModel.updateOne({ student_id: studentId }, calculationResult);
    }
  } catch (error) {
    throw new Error(error.message);
  }
}

/**
 * Evaluate block-level pass/fail status based on block-test based conditions.
 * @param {Object} params - Parameters for block result calculation.
 * @param {Array<Object>} params.blockPassConditions - Pass conditions object for the block.
 * @param {Object} params.calculationResultPayload - Payload containing subject and test results
 * @returns {Boolean} - Returns boolean result generated from CalculatePassConditions()
 */
function CalculateBlockResult({ blockPassConditions, calculationResultPayload }) {
  // *************** sanity check for the pass conditions
  if (!blockPassConditions || !blockPassConditions.length) return true;
  const blockResult = [];

  for (const passCondition of blockPassConditions) {
    // *************** START: Pass condition processing for parameter 'average_of' ***************
    if (passCondition.parameter === 'average_of') {
      // *************** check if syllabus type is 'block'
      if (passCondition.syllabus_type === 'block') {
        // *************** call MathOperatorParser to do the math comparation
        const result = MathOperatorParser({
          mathOperator: passCondition.math_operator,
          parameterValue: passCondition.parameter_value,
          valueToCompare: calculationResultPayload.total_marks,
        });
        if (passCondition.logical_operator) {
          blockResult.push(passCondition.logical_operator);
        }
        // *************** push math comparation result (true/false)
        blockResult.push(result);
      }

      // *************** check if syllabus type is 'subject'
      if (passCondition.syllabus_type === 'subject') {
        // *************** validate subject_id within pass condition
        ValidateMongoObjectId(passCondition.subject_id);

        // *************** get subject data that relevant with passCondition.subject_id
        const subjectData = calculationResultPayload.subject_results.find((s) => String(s.subject_id) === String(passCondition.subject_id));

        // *************** call MathOperatorParser to do the math comparation
        const result = MathOperatorParser({
          mathOperator: passCondition.math_operator,
          parameterValue: passCondition.parameter_value,
          valueToCompare: subjectData?.total_marks,
        });
        // *************** add logical operator ('and' or 'or') into the blockResultArray
        if (passCondition.logical_operator) {
          blockResult.push(passCondition.logical_operator);
        }
        // *************** push math comparation result (true/false)
        blockResult.push(result);
      }
    }
    // *************** END: End of pass condition checking for parameter 'average_of' ***************

    // *************** START: Pass condition processing for parameter 'mark' ***************
    if (passCondition.parameter === 'mark') {
      // *************** validate test_id within pass condition
      ValidateMongoObjectId(passCondition.test_id);

      // *************** get test data that relevant with passCondition.test_id
      let testData;
      for (const subject of calculationResultPayload.subject_results) {
        testData = subject.test_results.find((test) => String(test.test_id) === String(passCondition.test_id));
        if (testData) break;
      }

      // *************** call MathOperatorParser to do the math comparation
      const result = MathOperatorParser({
        mathOperator: passCondition.math_operator,
        parameterValue: passCondition.parameter_value,
        valueToCompare: testData?.weighted_mark,
      });

      // *************** add logical operator if it exists
      if (passCondition.logical_operator) {
        blockResult.push(passCondition.logical_operator);
      }
      blockResult.push(result);
    }
    // *************** END: End of pass condition checking for parameter 'mark' ***************
  }
  // *************** call helper to calculate final result
  const finalResult = CalculatePassConditions(blockResult);
  return finalResult;
}

/**
 * Evaluate subject-level pass/fail status based on subject-test based conditions.
 * @param {Object} params - Parameters for subject result calculation.
 * @param {Array<Object>} params.subjectPassConditions - Pass conditions objects of subject.
 * @param {Object} params.subjectCalculationResultPayload - Payload containing subject marks and test results.
 * @returns {Boolean} - Returns boolean result generated by CalculatePassConditions.
 */
function CalculateSubjectResult({ subjectPassConditions, subjectCalculationResultPayload }) {
  // *************** sanity check for the pass conditions
  if (!subjectPassConditions || !subjectPassConditions.length) return true;
  const subjectResult = [];
  for (const passCondition of subjectPassConditions) {
    if (passCondition.parameter === 'average_of') {
      // *************** call helper to run the comparation
      const result = MathOperatorParser({
        mathOperator: passCondition.math_operator,
        parameterValue: passCondition.parameter_value,
        valueToCompare: subjectCalculationResultPayload.total_marks,
      });

      // *************** add logical operator if it exists
      if (passCondition.logical_operator) {
        subjectResult.push(passCondition.logical_operator);
      }
      subjectResult.push(result);
    }

    if (passCondition.parameter === 'mark') {
      ValidateMongoObjectId(passCondition.test_id);

      // *************** get test object from test_results field that matched test_id
      let testData;
      testData = subjectCalculationResultPayload.test_results.find((test) => String(test.test_id) === String(passCondition.test_id));

      // *************** call helper to run the comparation
      const result = MathOperatorParser({
        mathOperator: passCondition.math_operator,
        parameterValue: passCondition.parameter_value,
        valueToCompare: testData?.weighted_mark,
      });

      // *************** add logical operator if it exists
      if (passCondition.logical_operator) {
        subjectResult.push(passCondition.logical_operator);
      }
      subjectResult.push(result);
    }
  }
  // *************** call helper to calculate final result
  const finalResult = CalculatePassConditions(subjectResult);
  return finalResult;
}

/**
 * Determine pass/fail status of a test based on weighted mark and its pass condition.
 * @param {Object} params - Parameters for test result evaluation.
 * @param {Object} params.testPassCondition - The pass condition object containing operator and value.
 * @param {Number} params.weightedMark - Weighted mark of the test to be compared.
 * @returns {Boolean} - Returns true if the test meets the pass condition, false otherwise.
 */
function CalculateTestResult({ testPassCondition, weightedMark }) {
  // *************** sanity check for the pass condition
  if (!testPassCondition) {
    return true;
  }

  // *************** call helper to run the comparation
  const result = MathOperatorParser({
    mathOperator: testPassCondition.math_operator,
    parameterValue: testPassCondition.parameter_value,
    valueToCompare: weightedMark,
  });
  return result;
}

/**
 * Evaluate a numeric comparison based on the provided pass conditions.
 * @param {Object} params - Parameters for math comparison.
 * @param {string} params.mathOperator - The comparison operator (e.g., 'greater_than').
 * @param {number} params.parameterValue - Threshold value for comparison.
 * @param {number} params.valueToCompare - Actual value to compare against the threshold.
 * @returns {Boolean} - Result of the math comparison.
 */
function MathOperatorParser({ mathOperator, parameterValue, valueToCompare }) {
  let result = false;
  if (mathOperator === 'greater_than') {
    result = valueToCompare > parameterValue;
  } else if (mathOperator === 'greater_or_equal_than') {
    result = valueToCompare >= parameterValue;
  } else if (mathOperator === 'less_than') {
    result = valueToCompare < parameterValue;
  } else if (mathOperator === 'less_or_equal_than') {
    result = valueToCompare <= parameterValue;
  } else if (mathOperator === 'equal') {
    result = valueToCompare === parameterValue;
  }
  return result;
}

/**
 * Evaluate logical conditions (e.g., AND/OR) from an array of boolean values and operators.
 * @param {Array<Boolean|string>} arrayOfResult - Array containing boolean values and logical operators ('and', 'or').
 * @returns {Boolean} - Final evaluation result of all conditions combined.
 */
function CalculatePassConditions(arrayOfResult) {
  // *************** temporary array for storing boolean values after 'and' operator executed, may contain 'or' operator
  const tempArray = [];
  let resultArrayIndex = 0;
  while (resultArrayIndex < arrayOfResult.length) {
    const currentElement = arrayOfResult[resultArrayIndex];
    // *************** prioritize executing the 'and' operator first
    if (currentElement === 'and') {
      // *************** get value for element in left side of comparation from  array input
      const leftValue = tempArray.pop();

      // *************** get value for element in right side of comparation from  array input
      const rightValue = arrayOfResult[resultArrayIndex + 1];

      // *************** run the comparation according to the arrayOfResult input
      const result = leftValue && rightValue;

      // *************** push executed result into tempArray
      tempArray.push(result);

      // *************** jump to the next operator, ensure that rightValue not pushed into tempArray
      resultArrayIndex += 2;
    } else {
      // *************** push current element into tempArray if there's no 'and' operator detected
      tempArray.push(currentElement);
      resultArrayIndex++;
    }
  }

  // *************** store the first element of tempArray
  let finalResult = tempArray[0];

  // *************** start the index from element 1
  let tempArrayIndex = 1;
  while (tempArrayIndex < tempArray.length) {
    const currentElement = tempArray[tempArrayIndex];
    // *************** solve the rest 'or' operator that might be stored in tempArray
    if (currentElement === 'or') {
      // *************** get value for element in right side of comparation from  tempArray
      const rightValue = tempArray[tempArrayIndex + 1];
      // *************** compare rightValue with finalResult using 'or' operator, set the  result into finalResult
      finalResult = finalResult || rightValue;

      // *************** jump to the next operator within tempArray if exists, ensure there's no repeated comparation
      tempArrayIndex += 2;
    } else {
      tempArrayIndex++;
    }
  }
  return finalResult;
}

// *************** EXPORT MODULE ***************
module.exports = { CalculateResult };
