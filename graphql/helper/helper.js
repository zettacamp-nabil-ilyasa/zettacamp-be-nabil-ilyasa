// *************** IMPORT LIBRARY ***************
const mongoose = require('mongoose')


 //*************** regex pattern to ensure email is includes @ and .
const emailRegexPattern = /^\S+@\S+\.\S+$/
//*************** regex pattern to ensure password is at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number
const passwordRegexPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
//*************** regex pattern to ensure name contains only letters
const nameRegexPattern = /^[a-zA-Z\s'-]+$/
//*************** regex pattern to ensure school name only have letters and numbers
const schoolNameRegexPattern = /^[a-zA-Z\s'-\d]+$/
//*************** regex pattern to ensure date is in YYYY-MM-DD format
const dateRegexPattern = /^\d{4}-\d{2}-\d{2}$/


/**
 * Check if school name already exist
 * @param {object} model - The mongoose model used for db query
 * @param {string} schoolName - The school's name to be checked
 * @param {string} excludeId - The id of the school to be excluded
 * @returns {Promise<boolean>} - True if school name already exists, false otherwise
 */
async function SchoolNameIsExist(model, schoolName, excludeId = null) {
    try{
        const isExist = await model.findOne({long_name: schoolName, status: 'active'})
        //*************** check if school name already exist
        if (!isExist){
            return false
        }
        //*************** check if existed school is the one to be excluded
        if (excludeId && isExist.id.toString() == excludeId.toString()) {
            return false
        } 
        //*************** return true, school name already registered
        return true
    }catch{
        throw new Error('invalid school id')
    }
}

/**
 * Checks if a user is an admin.
 * @param {object} model - The Mongoose model used for db query.
 * @param {string} userId - The ID of the user to validate.
 * @returns {Promise<boolean>} - True if user is admin, false otherwise.
 */
async function UserIsAdmin(model, userId){
    try{
        const isExist = await model.findOne({_id: userId, role: 'admin'})
        //*************** check if user already exist and is an admin
        if (!isExist){
            return false
        }
        return true
    }catch(error){
        throw new Error(error.message)
    }
}

/**
 * Checks if a school with the given ID exists.
 * @param {object} model - The Mongoose model used for db query.
 * @param {string} schoolId - The ID of school to validate.
 * @returns {Promise<boolean>} - True if school exists, false otherwise.
 */
async function SchoolIsExist(model, schoolId) {
    try{
        const isExist = await model.findOne({_id: schoolId})
        //*************** check if school with provided schoolId already exist
        if (!isExist){
            return false
        }
        return true
    }catch(error){
        console.log("logging error: ", error.message)
        throw error
    }
}

/**
 * Converts a string to title case.
 * @param {string} string - The string to convert.
 * @returns {string} - The converted string in title case.
 */
function toTitleCase(string) {
    const lowercase = string.toLowerCase()
    const splittedString = lowercase.split(' ')
    return splittedString.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

/**
 * Validates user creation input.
 * @param {object} input - The input object containing user data.
 * @returns {object} - The validated and formatted input.
 * @throws {Error} - If validation fails.
 */

//***************USER HELPER***************
function ValidateUserCreateInput (input) {
    let {first_name, last_name, email, password, role} = input

    if (!emailRegexPattern.test(email)){
        throw new Error('email format is invalid')
    }
    if (!passwordRegexPattern.test(password)) {
        throw new Error('password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number')
    }
    if (!nameRegexPattern.test(first_name)) {
        throw new Error('first name contains invalid characters')
    }
    if (!nameRegexPattern.test(last_name)) {
        throw new Error('last name contains invalid characters')
    }

    first_name = toTitleCase(first_name)
    last_name = toTitleCase(last_name)

    const validatedInput = {first_name, last_name, email, password, role}
    return validatedInput
}

/**
 * Validates user update input.
 * @param {object} input - The input object containing updated user data.
 * @returns {object} - The validated and formatted input.
 * @throws {Error} - If validation fails.
 */
function ValidateUserUpdateInput (input){
    let {id,first_name, last_name, email, password} = input
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('invalid school id')
    }
    if (email && !emailRegexPattern.test(email)){
        throw new Error('email format is invalid')
    }
    if (password && !passwordRegexPattern.test(password)) {
        throw new Error('password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number')
    }
    if (first_name && !nameRegexPattern.test(first_name)) {
        throw new Error('first name contains invalid characters')
    }
    if (last_name && !nameRegexPattern.test(last_name)) {
        throw new Error('last name contains invalid characters')
    }

    first_name = toTitleCase(first_name)
    last_name = toTitleCase(last_name)

    const validatedInput = {first_name, last_name, email, password}
    return validatedInput
}

//***************SCHOOL HELPER***************

/**
 * Validates school creation input.
 * @param {object} input - The input object containing school data.
 * @returns {object} - The validated and formatted input.
 * @throws {Error} - If validation fails.
 */
function ValidateSchoolCreateInput (input){
    let {brand_name, long_name, address} = input

    if (!schoolNameRegexPattern.test(brand_name)) {
        throw new Error('brand name contains invalid characters')
    }
    if (!schoolNameRegexPattern.test(long_name)) {
        throw new Error('long name contains invalid characters')
    }
    brand_name = toTitleCase(brand_name)
    long_name = toTitleCase(long_name)

    const validatedInput = {brand_name, long_name, address}
    return validatedInput
}

/**
 * Validates school update input.
 * @param {object} input - The input object containing updated school data.
 * @returns {object} - The validated and formatted input.
 * @throws {Error} - If validation fails.
 */
function ValidateSchoolUpdateInput (input){
    let {id, brand_name, long_name, address} = input

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('invalid school id')
    }
    if (brand_name && !schoolNameRegexPattern.test(brand_name)) {
        throw new Error('brand name contains invalid characters')
    }
    if (long_name && !schoolNameRegexPattern.test(long_name)) {
        throw new Error('long name contains invalid characters')
    }
    brand_name = toTitleCase(brand_name)
    long_name = toTitleCase(long_name)

    const validatedInput = {id, brand_name, long_name, address}
    return validatedInput
}

//***************STUDENT HELPER****************

/**
 * Validates student creation input.
 * @param {object} input - The input object containing student data.
 * @returns {object} - The validated and formatted input.
 * @throws {Error} - If validation fails.
 */

function ValidateStudentCreateInput (input) {
    let {first_name, last_name, email, date_of_birth, school_id} = input

    if (!emailRegexPattern.test(email)){
        throw new Error('email format is invalid')
    }
    if (!nameRegexPattern.test(first_name)) {
        throw new Error('first name contains invalid characters')
    }
    if (!nameRegexPattern.test(last_name)) {
        throw new Error('last name contains invalid characters')
    }

    if(date_of_birth){
        //*************** check if date of birth is valid 
        if (typeof date_of_birth === 'string' && !dateRegexPattern.test(date_of_birth)) {
            throw new Error('date of birth format must be in YYYY-MM-DD format')
        }
        const birthDate = new Date(date_of_birth)
        const today = new Date(date_of_birth)

        //*************** check if date of birth is an uncoming date
        if (birthDate > today) {
            throw new Error('invalid date of birth value')
        }}
    first_name = toTitleCase(first_name)
    last_name = toTitleCase(last_name)

    const validatedInput = {first_name, last_name, email, date_of_birth, school_id}
    return validatedInput
}

/**
 * Validates input for creating both a user and a student.
 * @param {object} input - The combined input object.
 * @returns {object} - The validated and formatted input.
 * @throws {Error} - If validation fails.
 */

function ValidateStudentAndUserCreateInput (input) {
    let {first_name, last_name, email, password, date_of_birth, school_id} = input
    
    if (!emailRegexPattern.test(email)){
        throw new Error('email format is invalid')
    }
    if (!passwordRegexPattern.test(password)) {
        throw new Error('password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number')
    }
    if (!nameRegexPattern.test(first_name)) {
        throw new Error('first name contains invalid characters')
    }
    if (!nameRegexPattern.test(last_name)) {
        throw new Error('last name contains invalid characters')
    }

    if(date_of_birth){
        //*************** check if date of birth is valid
        if (typeof date_of_birth === 'string' && !dateRegexPattern.test(date_of_birth)) {
            throw new Error('date of birth format must be in YYYY-MM-DD format')
        }
        const birthDate = new Date(date_of_birth)
        const today = new Date(date_of_birth)

        //*************** check if date of birth is an uncoming date
        if (birthDate > today) {
            throw new Error('invalid date of birth value')
        }}
    first_name = toTitleCase(first_name)
    last_name = toTitleCase(last_name)

    const validatedInput = {first_name, last_name, email, password, date_of_birth, school_id}
    return validatedInput
}

/**
 * Validates student update input.
 * @param {object} input - The input object containing updated student data.
 * @returns {object} - The validated and formatted input.
 * @throws {Error} - If validation fails.
 */
function ValidateStudentUpdateInput (input) {
    let {id, first_name, last_name, email, date_of_birth, school_id} = input

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('invalid school id')
    }
    if (email && !emailRegexPattern.test(email)){
        throw new Error('email format is invalid')
    }
    if (first_name && !nameRegexPattern.test(first_name)) {
        throw new Error('first name contains invalid characters')
    }
    if (last_name && !nameRegexPattern.test(last_name)) {
        throw new Error('last name contains invalid characters')
    }
    if (!mongoose.Types.ObjectId.isValid(school_id)) {
        throw new Error('invalid school id')
    }

    if(date_of_birth){
        //*************** check if date of birth is valid
        if (typeof date_of_birth === 'string' && !dateRegexPattern.test(date_of_birth)) {
            throw new Error('date of birth format must be in YYYY-MM-DD format')
        }
        const birthDate = new Date(date_of_birth)
        const today = new Date(date_of_birth)

        //*************** check if date of birth is an uncoming date
        if (birthDate > today) {
            throw new Error('invalid date of birth value')
        }}
    first_name = toTitleCase(first_name)
    last_name = toTitleCase(last_name)

    const validatedInput =  {id, first_name, last_name, email, date_of_birth, school_id}
    return validatedInput
}


// *************** EXPORT MODULE ***************
module.exports = {SchoolNameIsExist, SchoolIsExist, UserIsAdmin,ValidateUserCreateInput, ValidateSchoolCreateInput, ValidateStudentCreateInput, ValidateStudentAndUserCreateInput,ValidateUserUpdateInput, ValidateSchoolUpdateInput, ValidateStudentUpdateInput}
