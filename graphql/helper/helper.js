// *************** IMPORT LIBRARY ***************
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// *************** IMPORT MODULE ***************
const User = require('../user/user.model');
const School = require('../school/school.model');
const Student = require('../student/student.model');

//*************** regex pattern to ensure email is includes @ and .
const emailRegexPattern = /^\S+@\S+\.\S+$/;
//*************** regex pattern to ensure password is at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number
const passwordRegexPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
//*************** regex pattern to ensure first and last name contains only letters
const firstAndLastNameRegexPattern = /^[a-zA-Z\s'-]+$/;
//*************** regex pattern to ensure school name only have letters and numbers
const schoolNameRegexPattern = /^[a-zA-Z\s'-\d]+$/;
//*************** regex pattern to ensure date is in YYYY-MM-DD format
const dateRegexPattern = /^\d{4}-\d{2}-\d{2}$/;

//*************** list of protected roles
const protectedRoles = ['user'];

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
 * @param {string} brandName - The school's brand name to be checked
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
 *
 * @param {string} password - Plaintext to be hashed.
 * @returns string - Hashed password
 * @throws {Error} - If hashing fails
 */
async function HashPassword(password) {
  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    throw new Error(error.message);
  }
}

/**
 * Check if role is valid
 * @param {string} role - The role to be checked
 * @returns {boolean} - True if role is valid, false otherwise
 */
function IsValidRole(role) {
  const validRoles = ['admin', 'user', 'student'];
  const isValidRole = validRoles.includes(role);
  return isValidRole;
}

/**
 * Check if role can be removed
 * @param {string} role - The role to be checked
 * @returns {boolean} - True if role can be removed, false otherwise
 */
function IsRemovableRole(role) {
  const isRemovableRole = !protectedRoles.includes(role);
  return isRemovableRole;
}

/**
 * Check is a user already have the given role
 * @param {string} userId - The id of the user
 * @param {string} role - The role to be checked
 * @returns {promise<boolean>} - True if user already have the role, false otherwise
 */
async function UserHasRole(userId, role) {
  try {
    const query = await User.countDocuments({ _id: userId, roles: role });
    const roleIsAlreadyExists = query > 0;
    return roleIsAlreadyExists;
  } catch (error) {
    throw new Error(error.message);
  }
}

/**
 *
 * @param {string} dateString - The date to be validated.
 * @returns {Date} - Validated date.
 * @throws {Error} - If validation fails.
 */
function ValidateDateOfBirth(dateString) {
  //*************** check if date of birth is comply with date format
  if (typeof dateString === 'string' && !dateRegexPattern.test(dateStr)) {
    throw new Error('date of birth format must be in YYYY-MM-DD format');
  }
  const birthDate = new Date(dateStr);
  const today = new Date();

  //*************** check if birth date is a future date
  if (isNaN(birthDate.getTime()) || birthDate > today) {
    throw new Error('invalid date of birth value');
  }
  return birthDate;
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
  if (!firstAndLastNameRegexPattern.test(first_name)) {
    throw new Error('first name contains invalid characters');
  }
  if (!firstAndLastNameRegexPattern.test(last_name)) {
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
    throw new Error('invalid user id');
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
    if (!firstAndLastNameRegexPattern.test(first_name)) {
      throw new Error('first name contains invalid characters');
    }
    first_name = ToTitleCase(first_name);
  }
  if (last_name) {
    if (!firstAndLastNameRegexPattern.test(last_name)) {
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
  if (!firstAndLastNameRegexPattern.test(first_name)) {
    throw new Error('first name contains invalid characters');
  }
  if (!firstAndLastNameRegexPattern.test(last_name)) {
    throw new Error('last name contains invalid characters');
  }

  date_of_birth = ValidateDateOfBirth(date_of_birth);
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
  if (!firstAndLastNameRegexPattern.test(first_name)) {
    throw new Error('first name contains invalid characters');
  }
  if (!firstAndLastNameRegexPattern.test(last_name)) {
    throw new Error('last name contains invalid characters');
  }

  date_of_birth = ValidateDateOfBirth(date_of_birth);
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
    throw new Error('invalid student id');
  }
  if (email && !emailRegexPattern.test(email)) {
    throw new Error('email format is invalid');
  }
  if (first_name) {
    if (!firstAndLastNameRegexPattern.test(first_name)) {
      throw new Error('first name contains invalid characters');
    }
    first_name = ToTitleCase(first_name);
  }
  if (last_name) {
    if (!firstAndLastNameRegexPattern.test(last_name)) {
      throw new Error('last name contains invalid characters');
    }
    last_name = ToTitleCase(last_name);
  }
  if (school_id && !mongoose.Types.ObjectId.isValid(school_id)) {
    throw new Error('invalid school id');
  }

  date_of_birth = ValidateDateOfBirth(date_of_birth);
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
  UserHasRole,
  IsValidRole,
  IsRemovableRole,
  HashPassword,
  ValidateUserCreateInput,
  ValidateSchoolCreateInput,
  ValidateStudentCreateInput,
  ValidateStudentAndUserCreateInput,
  ValidateUserUpdateInput,
  ValidateSchoolUpdateInput,
  ValidateStudentUpdateInput,
};
