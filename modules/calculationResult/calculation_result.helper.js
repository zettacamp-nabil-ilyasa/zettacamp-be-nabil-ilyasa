// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const StudentTestResultModel = require('../studentTestResult/student_test_result.model.js');
const ErrorLogModel = require('../errorLog/error_log.model.js');

// *************** IMPORT VALIDATOR ***************
const { ValidateMongoObjectId } = require('../../utilities/validators/mongo-validator.js');

async function CalculateResult(studentId) {
  // *************** validate student's id
  ValidateMongoObjectId(studentId);

  // *************** get populated student test results documents using student's id as filterclea
  const populatedStudentTestResults = await StudentTestResultModel.find({ student_id: studentId, status: 'validated' })
    .populate({
      path: 'test_id',
      populate: { path: 'subject_id', populate: { path: 'block_id' } },
    })
    .lean();

  console.log('POPULATED DATA', populatedStudentTestResults);
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
  console.log('GROUPED DOCUMENT', groupedDocumentsByBlock);
  // *************** END: Store the grouping result into grouppedDocumentsByBlock ***************

  // *************** START: Construct payload for calculation_result model ***************
  const calculationResultObjects = [];

  // *************** create an array out of grouppedDocumentsByBlock
  const arrayedDocuments = Object.entries(groupedDocumentsByBlock);

  // *************** start a loop to construct payload
  for (const [blockId, blockData] of arrayedDocuments) {
    // *************** set up a base payload object
    const calculationResultPayload = {
      block_id: blockId,
      block_result: '',
      subject_results: [],
    };
    let totalOfSubjectsMarks = 0;

    // *************** start another loop for payload's subject results
    for (const [subjectId, subjectData] of Object.entries(blockData.subjects)) {
      let totalWeightedMarks = 0;
      const testResults = [];

      // *************** start another loop for test processing within subject
      for (const result of subjectData.results) {
        // *************** calculate the test result's weighted marks
        const weightedMark = result.average_mark * result.test_id.weight;

        // *************** add the weightedMark to outer variable
        totalWeightedMarks += weightedMark;

        // *************** push test results to outer variable
        testResults.push({
          test_id: result.test_id._id,
          test_result: '',
          average_mark: result.average_mark,
          weighted_mark: weightedMark,
        });
      }
      // *************** calculate subject's total mark
      const subjectTotalMark = (totalWeightedMarks / subjectData.results.length) * subjectData.subject.coefficient;

      // *************** push subject results to payload object
      calculationResultPayload.subject_results.push({
        subject_id: subjectId,
        total_marks: subjectTotalMark,
        subject_result: '',
        test_results: testResults,
      });

      // *************** add the subject's total mark to outer variable
      totalOfSubjectsMarks += subjectTotalMark;

      const subjectScopeEvaluatedConditions = CalculateSubjectResult({
        subjectPassConditions: subjectData.subject.pass_conditions,
        calculationResultPayload: calculationResultPayload,
      });
      console.log('SUBJECT SCOPE CALCULATE RESULT PAYLOAD', calculationResultPayload);
      console.log('SUBJECT SCOPE EVALUATED CONDITIONS', subjectScopeEvaluatedConditions);
      calculationResultObjects.push(calculationResultPayload);
    }
    calculationResultPayload.total_marks = totalOfSubjectsMarks / Object.keys(blockData.subjects).length;
    const blockScopeEvaluatedConditions = CalculateBlockResult({
      blockPassConditions: blockData.block.pass_conditions,
      calculationResultPayload: calculationResultPayload,
    });
    console.log('CALCULATE RESULT PAYLOAD', calculationResultPayload);
    console.log('BLOCK SCOPE EVALUATED CONDITIONS', blockScopeEvaluatedConditions);
    calculationResultObjects.push(calculationResultPayload);
  }
  console.log('CALCULATION RESULT OBJECTS', calculationResultObjects);
  // return calculationResultObjects;
}

function CalculateBlockResult({ blockPassConditions, calculationResultPayload }) {
  blockResult: [];

  for (const passCondition of blockPassConditions) {
    // *************** START: Pass condition processing for parameter 'average_of' ***************
    if (passCondition.parameter === 'average_of') {
      // *************** check if syllabus type is 'block'
      if (passCondition.syllabus_type === 'block') {
        // *************** call MathOperatorParser to do the math comparation
        const result = MathOperatorParser({
          mathOperator: passCondition.math_operator,
          parameterValue: passCondition.parameter_value,
          valueToCompare: passCondition.total_marks,
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
        console.log('SUBJECT ID', passCondition.subject_id);
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
      console.log('TEST ID', passCondition.test_id);
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

      if (passCondition.logical_operator) {
        blockResult.push(passCondition.logical_operator);
      }
      blockResult.push(result);
    }
    // *************** END: End of pass condition checking for parameter 'mark' ***************
  }
  return blockResult;
}

function CalculateSubjectResult({ subjectPassConditions, calculationResultPayload }) {
  const subjectResult = [];
  for (const passCondition of subjectPassConditions) {
    if (passCondition.parameter === 'average_of') {
      const subjectData = calculationResultPayload.subject_results.find(
        (subject) => String(subject.subject_id) === String(passCondition.subject_id)
      );
      const result = MathOperatorParser({
        mathOperator: passCondition.math_operator,
        parameterValue: passCondition.parameter_value,
        valueToCompare: subjectData?.total_marks,
      });

      if (passCondition.logical_operator) {
        subjectResult.push(passCondition.logical_operator);
      }
      subjectResult.push(result);
    }

    if (passCondition.parameter === 'mark') {
      ValidateMongoObjectId(passCondition.test_id);

      let testData;
      for (const subject of calculationResultPayload.subject_results) {
        testData = subject.test_results.find((test) => String(test.test_id) === String(passCondition.test_id));
        if (testData) break;
      }
      const result = MathOperatorParser({
        mathOperator: passCondition.math_operator,
        parameterValue: passCondition.parameter_value,
        valueToCompare: testData?.weighted_mark,
      });
      if (passCondition.logical_operator) {
        subjectResult.push(passCondition.logical_operator);
      }
      subjectResult.push(result);
    }
  }
  return subjectResult;
}

function CalculateTestResult(testPassConditions) {}

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
//output calculateblockresult itu bisa sekalian

module.exports = { CalculateResult };
