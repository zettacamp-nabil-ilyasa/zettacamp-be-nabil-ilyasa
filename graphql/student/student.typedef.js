// *************** IMPORT LIBRARY ***************
const { gql } = require('apollo-server');

// ***************
const studentTypeDefs = gql`
  type Student {
    # Document id
    _id: ID!

    # First name
    first_name: String!

    # Last name
    last_name: String!

    # Email
    email: String!

    # Date of birth
    date_of_birth: String

    # Reference to school
    school: School!

    # id of school associated with this student
    school_id: ID

    # Reference to associated user
    user: User

    # id of user associated with this student
    user_id: ID

    # Student status
    status: Status!

    # Soft-delete timestamp
    deleted_at: String

    # Reference to user who deleted this student
    deleted_by: ID
  }

  input CreateStudentInput {
    # First name for create student input
    first_name: String!

    # Last name for create student input
    last_name: String!

    # Email for create student input
    email: String!

    # Date of birth for create student input
    date_of_birth: String

    # School id for create student input
    school_id: String!
  }

  input CreateStudentWithUserInput {
    # First name for create student with user input
    first_name: String!

    # Last name for create student with user input
    last_name: String!

    # Email for create student with user input
    email: String!

    # Password for the user account
    password: String!

    # Date of birth for create student with user input
    date_of_birth: String

    # Reference to school
    school_id: String!
  }

  input UpdateStudentInput {
    # Student document id to specify the student
    _id: ID!

    # First name for update student input
    first_name: String

    # Last name for update student input
    last_name: String

    # Email for update student input
    email: String

    # Date of birth for update student input
    date_of_birth: String

    # School id for update student input
    school_id: String
  }

  extend type Query {
    GetAllStudents: [Student]
    GetOneStudent(_id: ID!): Student
  }

  extend type Mutation {
    CreateStudent(input: CreateStudentInput): Student
    CreateStudentWithUser(input: CreateStudentWithUserInput): Student
    UpdateStudent(input: UpdateStudentInput): Student
    DeleteStudent(_id: ID!, deletedBy: ID!): String
  }
`;

// *************** EXPORT MODULE ***************
module.exports = studentTypeDefs;
