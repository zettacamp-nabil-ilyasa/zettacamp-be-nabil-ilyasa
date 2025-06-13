// *************** IMPORT LIBRARY ***************
const mongoose = require('mongoose');

// *************** IMPORT MODULE ***************
const User = require('../user/user.model');
const School = require('../school/school.model');
const Student = require('../student/student.model');

//*************** regex pattern to ensure email is includes @ and .
const emailRegexPattern = /^\S+@\S+\.\S+$/;
//*************** regex pattern to ensure password is at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number
const passwordRegexPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
//*************** regex pattern to ensure user name contains only letters
const userNameRegexPattern = /^[a-zA-Z\s'-]+$/;
//*************** regex pattern to ensure student name contains only letters
const studentNameRegexPattern = /^[a-zA-Z\s'-]+$/;
//*************** regex pattern to ensure school name only have letters and numbers
const schoolNameRegexPattern = /^[a-zA-Z\s'-\d]+$/;
//*************** regex pattern to ensure date is in YYYY-MM-DD format
const dateRegexPattern = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Converts a string to title case.
 * @param {string} string - The string to convert.
 * @returns {string} - The converted string in title case.
 */
function ToTitleCase(string) {
  const lowercase = string.toLowerCase();
  const splittedString = lowercase.split(' ');
  return splittedString.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

/**
 * Check if a User with the given ID already exists.
 * @param {string} userId - The id of the user to be checked.
 * @returns {promise<boolean>} - True if user already exist, false otherwise.
 */
async function UserIsExist(userId) {
  try {
    const query = { _id: userId, status: 'active' };
    const count = await User.countDocuments(query);
    return count > 0;
  } catch (error) {
    throw new Error(error.message);
  }
}

/**
 * Check if a School with the given ID already exists.
 * @param {string} schoolId - The id of the user to be checked.
 * @returns {promise<boolean>} - True if user already exist, false otherwise.
 */
async function SchoolIsExist(schoolId) {
  try {
    const query = { _id: schoolId, status: 'active' };
    const count = await School.countDocuments(query);
    return count > 0;
  } catch (error) {
    throw new Error(error.message);
  }
}

/**
 * Check if a Student with the given ID already exists.
 * @param {string} studentId - The id of the user to be checked.
 * @returns {promise<boolean>} - True if user already exist, false otherwise.
 */
async function StudentIsExist(studentId) {
  try {
    const query = { _id: studentId, status: 'active' };
    const count = await Student.countDocuments(query);
    return count > 0;
  } catch (error) {
    throw new Error(error.message);
  }
}

/**
 * Check if user email already exist
 * @param {string} emailAcc - The email to be checked.
 * @param {string} excludeId - The id of the user to be excluded.
 * @returns {promise<boolean>} - True if email already exist, false otherwise
 */
async function UserEmailIsExist(emailAcc, excludeId = null) {
  try {
    //*************** set query for db operation
    const query = { email: emailAcc };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const count = await User.countDocuments(query);
    return count > 0;
  } catch (error) {
    throw new Error(error.message);
  }
}

/**
 * Check if student email already exist
 * @param {string} emailAcc - The email to be checked.
 * @param {string} excludeId - The id of the user to be excluded.
 * @returns {promise<boolean>} - True if email already exist, false otherwise
 */
async function StudentEmailIsExist(emailAcc, excludeId = null) {
  try {
    //*************** set query for db operation
    const query = { email: emailAcc };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const count = await Student.countDocuments(query);
    return count > 0;
  } catch (error) {
    throw new Error(error.message);
  }
}

/**
 * Check if school name already exist
 * @param {string} longName - The school's long name to be checked
 * @param {string} excludeId - The id of the school to be excluded
 * @returns {Promise<boolean>} - True if school name already exists, false otherwise
 */
async function SchoolLongNameIsExist(longName, excludeId = null) {
  try {
    //*************** set query for db operation
    const query = { long_name: longName };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const count = await School.countDocuments(query);
    return count > 0;
  } catch (error) {
    throw new Error(error.message);
  }
}

/**
 * Check if school name already exist
 * @param {string} longName - The school's brand name to be checked
 * @param {string} excludeId - The id of the school to be excluded
 * @returns {Promise<boolean>} - True if school name already exists, false otherwise
 */
async function SchoolBrandNameIsExist(brandName, excludeId = null) {
  try {
    //*************** set query for db operation
    const query = { brand_name: brandName };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const count = await School.countDocuments(query);
    return count > 0;
  } catch (error) {
    throw new Error(error.message);
  }
}

/**
 * Checks if a user has admin role.
 * @param {string} userId - The ID of the user to validate.
 * @returns {Promise<boolean>} - True if user is admin, false otherwise.
 */
async function UserIsAdmin(userId) {
  try {
    const query = { _id: userId, role: 'admin' };
    const count = await User.countDocuments(query);
    return count > 0;
  } catch (error) {
    throw new Error(error.message);
  }
}

//***************USER HELPER***************

/**
 * Validates user creation input.
 * @param {object} input - The input object containing user data.
 * @returns {object} - The validated and formatted input.
 * @throws {Error} - If validation fails.
 */
function ValidateUserCreateInput(input) {
  let { first_name, last_name, email, password, role } = input;

  if (!emailRegexPattern.test(email)) {
    throw new Error('email format is invalid');
  }
  if (!passwordRegexPattern.test(password)) {
    throw new Error(
      'password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number'
    );
  }
  if (!userNameRegexPattern.test(first_name)) {
    throw new Error('first name contains invalid characters');
  }
  if (!userNameRegexPattern.test(last_name)) {
    throw new Error('last name contains invalid characters');
  }

  first_name = ToTitleCase(first_name);
  last_name = ToTitleCase(last_name);

  const validatedInput = { first_name, last_name, email, password, role };
  return validatedInput;
}

/**
 * Validates user update input.
 * @param {object} input - The input object containing updated user data.
 * @returns {object} - The validated and formatted input.
 * @throws {Error} - If validation fails.
 */
function ValidateUserUpdateInput(input) {
  let { _id, first_name, last_name, email, password } = input;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    throw new Error('invalid school id');
  }
  if (email && !emailRegexPattern.test(email)) {
    throw new Error('email format is invalid');
  }
  if (password && !passwordRegexPattern.test(password)) {
    throw new Error(
      'password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number'
    );
  }
  if (first_name) {
    if (!userNameRegexPattern.test(first_name)) {
      throw new Error('first name contains invalid characters');
    }
    first_name = ToTitleCase(first_name);
  }
  if (last_name) {
    if (!userNameRegexPattern.test(last_name)) {
      throw new Error('last name contains invalid characters');
    }
    last_name = ToTitleCase(last_name);
  }
  const validatedInput = { _id, first_name, last_name, email, password };
  return validatedInput;
}

//***************SCHOOL HELPER***************

/**
 * Validates school creation input.
 * @param {object} input - The input object containing school data.
 * @returns {object} - The validated and formatted input.
 * @throws {Error} - If validation fails.
 */
function ValidateSchoolCreateInput(input) {
  let { brand_name, long_name, address } = input;

  if (!schoolNameRegexPattern.test(brand_name)) {
    throw new Error('brand name contains invalid characters');
  }
  if (!schoolNameRegexPattern.test(long_name)) {
    throw new Error('long name contains invalid characters');
  }
  long_name = ToTitleCase(long_name);

  const validatedInput = { brand_name, long_name, address };
  return validatedInput;
}

/**
 * Validates school update input.
 * @param {object} input - The input object containing updated school data.
 * @returns {object} - The validated and formatted input.
 * @throws {Error} - If validation fails.
 */
function ValidateSchoolUpdateInput(input) {
  let { _id, brand_name, long_name, address } = input;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    throw new Error('invalid school id');
  }
  if (brand_name && !schoolNameRegexPattern.test(brand_name)) {
    throw new Error('brand name contains invalid characters');
  }
  if (long_name) {
    if (!schoolNameRegexPattern.test(long_name)) {
      throw new Error('long name contains invalid characters');
    }
    long_name = ToTitleCase(long_name);
  }

  const validatedInput = { _id, brand_name, long_name, address };
  return validatedInput;
}

//***************STUDENT HELPER****************

/**
 * Validates student creation input.
 * @param {object} input - The input object containing student data.
 * @returns {object} - The validated and formatted input.
 * @throws {Error} - If validation fails.
 */
function ValidateStudentCreateInput(input) {
  let { first_name, last_name, email, date_of_birth, school_id } = input;

  if (!emailRegexPattern.test(email)) {
    throw new Error('email format is invalid');
  }
  if (!studentNameRegexPattern.test(first_name)) {
    throw new Error('first name contains invalid characters');
  }
  if (!studentNameRegexPattern.test(last_name)) {
    throw new Error('last name contains invalid characters');
  }

  if (date_of_birth) {
    //*************** check if date of birth is valid
    if (typeof date_of_birth === 'string' && !dateRegexPattern.test(date_of_birth)) {
      throw new Error('date of birth format must be in YYYY-MM-DD format');
    }
    const birthDate = new Date(date_of_birth);
    const today = new Date(today);

    //*************** check if date of birth is valid
    if (isNaN(birthDate.getTime())) {
      throw new Error('invalid date of birth value');
    }

    //*************** check if date of birth is an uncoming date
    if (birthDate > today) {
      throw new Error('invalid date of birth value');
    }
  }
  first_name = ToTitleCase(first_name);
  last_name = ToTitleCase(last_name);

  const validatedInput = { first_name, last_name, email, date_of_birth, school_id };
  return validatedInput;
}

/**
 * Validates input for creating both a user and a student.
 * @param {object} input - The combined input object.
 * @returns {object} - The validated and formatted input.
 * @throws {Error} - If validation fails.
 */
function ValidateStudentAndUserCreateInput(input) {
  let { first_name, last_name, email, password, date_of_birth, school_id } = input;

  if (!emailRegexPattern.test(email)) {
    throw new Error('email format is invalid');
  }
  if (!passwordRegexPattern.test(password)) {
    throw new Error(
      'password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number'
    );
  }
  if (!studentNameRegexPattern.test(first_name)) {
    throw new Error('first name contains invalid characters');
  }
  if (!studentNameRegexPattern.test(last_name)) {
    throw new Error('last name contains invalid characters');
  }

  if (date_of_birth) {
    //*************** check if date of birth is valid
    if (typeof date_of_birth === 'string' && !dateRegexPattern.test(date_of_birth)) {
      throw new Error('date of birth format must be in YYYY-MM-DD format');
    }
    const birthDate = new Date(date_of_birth);
    const today = new Date();

    //*************** check if date of birth is valid
    if (isNaN(birthDate.getTime())) {
      throw new Error('invalid date of birth value');
    }

    //*************** check if date of birth is an uncoming date
    if (birthDate > today) {
      throw new Error('invalid date of birth value');
    }
  }
  first_name = ToTitleCase(first_name);
  last_name = ToTitleCase(last_name);

  const validatedInput = { first_name, last_name, email, password, date_of_birth, school_id };
  return validatedInput;
}

/**
 * Validates student update input.
 * @param {object} input - The input object containing updated student data.
 * @returns {object} - The validated and formatted input.
 * @throws {Error} - If validation fails.
 */
function ValidateStudentUpdateInput(input) {
  let { _id, first_name, last_name, email, date_of_birth, school_id } = input;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    throw new Error('invalid school id');
  }
  if (email && !emailRegexPattern.test(email)) {
    throw new Error('email format is invalid');
  }
  if (first_name) {
    if (!studentNameRegexPattern.test(first_name)) {
      throw new Error('first name contains invalid characters');
    }
    first_name = ToTitleCase(first_name);
  }
  if (last_name) {
    if (!studentNameRegexPattern.test(last_name)) {
      throw new Error('last name contains invalid characters');
    }
    last_name = ToTitleCase(last_name);
  }
  if (school_id && !mongoose.Types.ObjectId.isValid(school_id)) {
    throw new Error('invalid school id');
  }

  if (date_of_birth) {
    //*************** check if date of birth (string) applied the format
    if (typeof date_of_birth === 'string' && !dateRegexPattern.test(date_of_birth)) {
      throw new Error('date of birth format must be in YYYY-MM-DD format');
    }

    const birthDate = new Date(date_of_birth);
    const today = new Date();

    //*************** check if date of birth is valid
    if (isNaN(birthDate.getTime())) {
      throw new Error('invalid date of birth value');
    }

    //*************** check if date of birth is an uncoming date
    if (birthDate > today) {
      throw new Error('invalid date of birth value');
    }
  }

  const validatedInput = { _id, first_name, last_name, email, date_of_birth, school_id };
  return validatedInput;
}

// *************** EXPORT MODULE ***************
module.exports = {
  UserEmailIsExist,
  StudentEmailIsExist,
  SchoolLongNameIsExist,
  SchoolBrandNameIsExist,
  SchoolIsExist,
  StudentIsExist,
  UserIsExist,
  UserIsAdmin,
  ValidateUserCreateInput,
  ValidateSchoolCreateInput,
  ValidateStudentCreateInput,
  ValidateStudentAndUserCreateInput,
  ValidateUserUpdateInput,
  ValidateSchoolUpdateInput,
  ValidateStudentUpdateInput,
};
