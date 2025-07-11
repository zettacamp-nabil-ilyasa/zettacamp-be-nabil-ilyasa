const { gql } = require('apollo-server-express');
const taskTypeDefs = gql`
  type Task {
    test_id: String
    user_id: String
    student_id: String
    corrector_id: String
    student_test_result_id: String
    type: Type!
    status: TaskStatus!
    due_date: Date
    created_at: Date!
    created_by: User
    updated_at: Date!
    deleted_at: Date
    deleted_by: User
    completed_at: Date
  }
  input TaskInput {
    test_id: String
    user_id: String
    student_id: String
    student_test_result_id: String
    due_date: Date
  }

  input TaskFilter {
    status: TaskStatus
    type: Type
  }

  enum Type {
    enter_marks
    validate_marks
    assign_corrector
  }

  enum TaskStatus {
    pending
    in_progress
    completed
    deleted
  }
`;

// *************** EXPORT MODULE ***************
module.exports = taskTypeDefs;
