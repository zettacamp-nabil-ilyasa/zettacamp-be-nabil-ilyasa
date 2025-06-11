const mongoose = require('mongoose')

/**
 * Function description
 * @param {object} model - model used for db query
 * @param {string} schoolName - school name to be checked
 * @param {string} excludeId - id of the school to be excluded
 * @returns {boolean} - true if school name already exist 
 */


async function NameIsExist(model, schoolName, excludeId = null) {
    const isExist = await model.findOne({long_name: schoolName, status: 'active'})
    //check if school name already exist
    if (!isExist){
        return false
    }
    //check if existed school is the one to be excluded
    if (excludeId && isExist.id.toString() == excludeId.toString()) {
        return false
    } 
    //return true, school name already registered
    return true
}

async function UserIsAdmin(model, userId){
    const isExist = await model.findOne({_id: userId, role: 'admin'})
    //check if user already exist
    if (!isExist){
        return false
    }
    return true
}

async function SchoolIsExist(model, schoolId) {
    const isExist = await model.findOne({_id: schoolId})
    //check if school name already exist
    if (!isExist){
        return false
    }
    return true
}

function toTitleCase(string) {
    const lowercase = string.toLowerCase()
    const splittedString = lowercase.split(' ')
    return splittedString.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}
//***************USER HELPER
function ValidateUserCreateInput (input) {
    let {first_name, last_name, email, password, role} = input

    if (!/^\S+@\S+\.\S+$/.test(email)){
        throw new Error('email format is invalid')
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
        throw new Error('password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number')
    }
    if (!/^[a-zA-Z\s'-]+$/.test(first_name)) {
        throw new Error('first name contains invalid characters')
    }
    if (!/^[a-zA-Z\s'-]+$/.test(last_name)) {
        throw new Error('last name contains invalid characters')
    }

    first_name = toTitleCase(first_name)
    last_name = toTitleCase(last_name)

    return {first_name, last_name, email, password, role}
}
function ValidateUserUpdateInput (input){
    let {id,first_name, last_name, email, password} = input
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('invalid school id')
    }
    if (first_name && !/^[a-zA-Z\s'-]+$/.test(first_name)) {
        throw new Error('first name contains invalid characters')
    }
    if (last_name && !/^[a-zA-Z\s'-]+$/.test(last_name)) {
        throw new Error('last name contains invalid characters')
    }
    if (password && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
        throw new Error('password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number')
    }
    if (email && !/^\S+@\S+\.\S+$/.test(email)){
        throw new Error('email format is invalid')
    }
    first_name = toTitleCase(first_name)
    last_name = toTitleCase(last_name)

    return {first_name, last_name, email, password}
}

//***************SCHOOL HELPER

function ValidateSchoolCreateInput (input){
    let {brand_name, long_name, address} = input

    if (!/^[a-zA-Z\s'-\d]+$/.test(brand_name)) {
        throw new Error('brand name contains invalid characters')
    }
    if (!/^[a-zA-Z\s'-\d]+$/.test(long_name)) {
        throw new Error('long name contains invalid characters')
    }
    brand_name = toTitleCase(brand_name)
    long_name = toTitleCase(long_name)

    return {brand_name, long_name, address}
}
function ValidateSchoolUpdateInput (input){
    let {id, brand_name, long_name, address} = input

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('invalid school id')
    }
    if (brand_name && !/^[a-zA-Z\s'-\d]+$/.test(brand_name)) {
        throw new Error('brand name contains invalid characters')
    }
    if (long_name && !/^[a-zA-Z\s'-\d]+$/.test(long_name)) {
        throw new Error('long name contains invalid characters')
    }
    brand_name = toTitleCase(brand_name)
    long_name = toTitleCase(long_name)

    return {brand_name, long_name, address}
}

//***************STUDENT HELPER
function ValidateStudentCreateInput (input) {
    let {first_name, last_name, email, date_of_birth, school_id} = input

    if (!/^\S+@\S+\.\S+$/.test(email)){
        throw new Error('email format is invalid')
    }
    if (!/^[a-zA-Z\s'-]+$/.test(first_name)) {
        throw new Error('first name contains invalid characters')
    }
    if (!/^[a-zA-Z\s'-]+$/.test(last_name)) {
        throw new Error('last name contains invalid characters')
    }

    if(date_of_birth){
        if (typeof date_of_birth === 'string' && !/^\d{4}-\d{2}-\d{2}$/.test(date_of_birth)) {
            throw new Error('date of birth format must be in YYYY-MM-DD format')
        }
        const birthDate = new Date(date_of_birth)
        const today = new Date(date_of_birth)
        if (birthDate > today) {
            throw new Error('invalid date of birth value')
        }}
    first_name = toTitleCase(first_name)
    last_name = toTitleCase(last_name)

    return {first_name, last_name, email, date_of_birth, school_id}
}

function ValidateStudentAndUserCreateInput (input) {
    let {first_name, last_name, email, date_of_birth, school_id, password} = input
    
    if (!/^\S+@\S+\.\S+$/.test(email)){
        throw new Error('email format is invalid')
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
        throw new Error('password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number')
    }
    if (!/^[a-zA-Z\s'-]+$/.test(first_name)) {
        throw new Error('first name contains invalid characters')
    }
    if (!/^[a-zA-Z\s'-]+$/.test(last_name)) {
        throw new Error('last name contains invalid characters')
    }

    if(date_of_birth){
        if (typeof date_of_birth === 'string' && !/^\d{4}-\d{2}-\d{2}$/.test(date_of_birth)) {
            throw new Error('date of birth format must be in YYYY-MM-DD format')
        }
        const birthDate = new Date(date_of_birth)
        const today = new Date(date_of_birth)
        if (birthDate > today) {
            throw new Error('invalid date of birth value')
        }}
    first_name = toTitleCase(first_name)
    last_name = toTitleCase(last_name)

    return {first_name, last_name, email, password, date_of_birth, school_id}
}

function ValidateStudentUpdateInput (input) {
    let {id, first_name, last_name, email, date_of_birth, school_id} = input

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('invalid school id')
    }
    if (first_name && !/^[a-zA-Z\s'-]+$/.test(first_name)) {
        throw new Error('first name contains invalid characters')
    }
    if (last_name && !/^[a-zA-Z\s'-]+$/.test(last_name)) {
        throw new Error('last name contains invalid characters')
    }
    if (email && !/^\S+@\S+\.\S+$/.test(email)){
        throw new Error('email format is invalid')
    }
    if (!mongoose.Types.ObjectId.isValid(school_id)) {
        throw new Error('invalid school id')
    }

    if(date_of_birth){
        if (typeof date_of_birth === 'string' && !/^\d{4}-\d{2}-\d{2}$/.test(date_of_birth)) {
            throw new Error('date of birth format must be in YYYY-MM-DD format')
        }
        const birthDate = new Date(date_of_birth)
        const today = new Date(date_of_birth)
        if (birthDate > today) {
            throw new Error('invalid date of birth value')
        }}
    first_name = toTitleCase(first_name)
    last_name = toTitleCase(last_name)

    return {first_name, last_name, email, date_of_birth}
}


// *************** EXPORT MODULE ***************
module.exports = {NameIsExist, SchoolIsExist, UserIsAdmin,ValidateUserCreateInput, ValidateSchoolCreateInput, ValidateStudentCreateInput, ValidateStudentAndUserCreateInput,ValidateUserUpdateInput, ValidateSchoolUpdateInput, ValidateStudentUpdateInput}
