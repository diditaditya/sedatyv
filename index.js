// basic type validator
function checkLeapYear(year) {
    if (year%4 === 0) {
        if (year%100 === 0) {
            if (year%400 === 0) {
                return true;
            } else {
                return false;
            }
        } else {
            return true;
        }
    } else {
        return false;
    }
}

function checkDay(day, month, isLeap) {
    let daysOfMonth = {}
    for (let m = 1; m <= 12; m++) {
        if (m === 2) {
            daysOfMonth[m] = isLeap ? 29 : 28;
        } else {
            if (m < 8) {
                daysOfMonth[m] = m%2 === 0 ? 30 : 31;
            } else {
                daysOfMonth[m] = m%2 === 0 ? 31 : 30;
            }
        }
    }
    return (day > 0 && day <= daysOfMonth[month]) ? true : false;
}

function validateDate(date) {
    let pat = /^(\d{4})-(\d{2})-(\d{2})$/;
    let tested = date.match(pat);
    if (tested) {
        let year = +tested[1];
        let month = +tested[2];
        let day = +tested[3];
        let isLeap = checkLeapYear(year);
        if (month < 1 || month > 12) {
            return { isValid: false, message: 'wrong month'};
        } else {
            if (checkDay(day, month, isLeap)) {
                return { isValid: true }
            }
            return { isValid: false, message: 'wrong day of the month' }
        }
    } else {
        return { isValid: false, message: 'date must be in format of yyyy-mm-dd'};
    }
}

function validateTime(time) {
    let pat = /^\d{2}:\d{2}$/;
    if (!pat.test(time)) { return { isValid: false, message: 'time must be in the 24h format of hh:mm' } }
    let parsed = time.split(':');
    if (+parsed[0] < 0 || +parsed[0] > 23) { return { isValid: false, message: 'hour must be 0 - 23' } };
    if (+parsed[1] < 0 || +parsed[1] > 59) { return { isValid: false, message: 'minute must be 0 - 59'} };
    return { isValid: true }
}

function validateString(string) {
    let pat = /^[;:!@\s]/;
    if (pat.test(string)) { return { isValid: false, message: 'cannot start with weird characters or space' } }
    if (typeof string !== 'string') { return { isValid: false, message: 'not a string' } }
    return { isValid: true }
}

function validateNumber(num) {
    if (typeof num === 'number') {
        return { isValid: true }
    }
    return { isValid: false, message: 'not a number' }
}

function validateFloat(data) {
    if (typeof data === 'number') {
        let pat = /^[0-9]+\.[0-9]+$/;
        console.log(pat.test(data));
        if (!pat.test(data.toString())) {
            return { isValid: false, message: 'not a float' }
        } else {
            return { isValid: true };
        }
    } else {
        return { isValid: false, message: 'not a float' }
    }
}

// util, remove ! mark
function removeMark(string) {
    if (typeof string === 'string') {
        if (/!$/.test(string)) {
            return string.slice(0, -1);
        }
    }
    
    return string;
}

function validateRequired(data, types) {
    if (data.constructor !== Object) {
        console.log(data.constructor);
        throw new Error('required fields can only be tested on object');
    }
    let keys = Object.keys(types);
    for (key of keys) {
        let val = Array.isArray(types[key]) ? types[key][0] : types[key];
        if (typeof val === 'string' ) {
            if (/!$/.test(types[key])) {
                if (!data[key]) {
                    return { isValid: false, message: `${key} is required` }
                }
                if (data[key].length === 0) {
                    return { isValid: false, message: `${key} is required` }
                }
            }
        }
    }
    return { isValid: true }
}

// array validator
function validateArray(array, dtypes) {
    if (!Array.isArray(array)) {
        return { isValid: false, message: 'must be an array' }
    }
    if (dtypes[0].constructor === Object) {
        for (let idx = 0; idx < array.length; idx++) {
            let validated = validateObject(array[idx], dtypes[0]);
            if (!validated.isValid) {
                validated.index = idx; 
                return validated;
            }
        }
    } else {
        for (let idx = 0; idx < array.length; idx++) {
            let validated = validateByType(array[idx], removeMark(dtypes[0]));
            if (!validated.isValid){
                validated.index = idx;
                return validated;
            }
        }
    }
    return { isValid: true }
}

// function mapper
const mapper = {
    'number': validateNumber,
    'string': validateString,
    'date': validateDate,
    'time': validateTime,
    'array': validateArray
};
const availableTypes = Object.keys(mapper);

// compound type validator
function validateByType(data, type, opt={}) {
    if (Array.isArray(data)) {
        return mapper['array'](data, type);
    }
    return mapper[type](data, opt);
}

function validateObject(obj, types) {
    let reqd = validateRequired(obj, types);
    if (!reqd.isValid) {
        return reqd;
    }
    let keys = Object.keys(obj);
    for (let key of keys) {
        if (types[key]) {
            let validated = validateByType(obj[key], removeMark(types[key]));
            if (!validated.isValid) {
                validated.field = key;
                return validated
            }
        }
    }
    return { isValid: true }
}

// any input validator
function validate(input, datatypes) {
    input = JSON.parse(JSON.stringify(input));
    if (Array.isArray(datatypes)) {
        if (typeof datatypes[0] === 'string') {
            for (let idx = 0; idx < input.length; idx++) {
                let validated = validateByType(input[idx], datatypes[0]);
                if (!validated.isValid){
                    validated.index = idx;
                    return validated;
                }
            }
        } else if (datatypes[0].constructor === Object) {
            for (let idx = 0; idx < input.length; idx++) {
                let validated = validateObject(input[idx], datatypes[0]);
                if (!validated.isValid){
                    validated.index = idx;
                    return validated;
                }
            }
        }
    } else if (datatypes.constructor === Object) {
        let validated = validateObject(input, datatypes);
            if (!validated.isValid){
                return validated;
            }
    } else {
        let validated = validateByType(input, datatypes);
        if (!validated.isValid) { return validated }
    }
    return { isValid: true }
}