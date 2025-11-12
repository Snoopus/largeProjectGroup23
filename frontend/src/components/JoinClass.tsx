import LoginStyles from '../css/Login.module.css';
import generalStyles from '../css/General.module.css';
import { useState, useEffect } from 'react';
import { buildPath } from '../services/buildPath';
import { validateClassCode, validateSection } from '../utils/validation';

// Merge both style objects - loginStyles will override generalStyles if there are conflicts
const styles = { ...generalStyles, ...LoginStyles };

// classes
// {
//     _id: ObjectId
//     name: String
//     duration: Int
//     instructorId: ObjectId
//     instructorName: String
//     studentList: [ObjectId]
//     currentAttendance: ObjectId
//     deviceName: String
//     secret: String
// }

function JoinClass()
{
    const [userId, setUserId] = useState('');
    const [classCode, setClassCode] = useState('');
    const [classSection, setClassSection] = useState('');
    const [message,setMessage] = useState('');
    
    // Validation state
    const [errors, setErrors] = useState({
        classCode: '',
        section: ''
    });
    const [touched, setTouched] = useState({
        classCode: false,
        section: false
    });

    // Validation functions
    const validateClassCodeField = () => {
        const result = validateClassCode(classCode);
        setErrors(prev => ({ ...prev, classCode: result.error }));
        return result.isValid;
    };

    const validateSectionField = () => {
        const result = validateSection(classSection);
        setErrors(prev => ({ ...prev, section: result.error }));
        return result.isValid;
    };

    const handleBlur = (field: keyof typeof touched) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        
        // Validate the field that was just blurred
        if (field === 'classCode') validateClassCodeField();
        else if (field === 'section') validateSectionField();
    };
    
    useEffect(() => {
        async function initializeUser() {
            // Get JWT token from localStorage
            const jwt = localStorage.getItem('jwt_token');
            if (!jwt) {
                setMessage('Please log in to join a class');
                return;
            }

            try {
                // Fetch decoded data from API
                const jwtresponse = await fetch(buildPath('api/checkjwt'), {
                    method: 'POST',
                    body: JSON.stringify({
                        possibleJWT: jwt
                    }),
                    headers: { 'Content-Type': 'application/json' }
                });
                const decodedjwt = await jwtresponse.json();

                if (decodedjwt.error) {
                    localStorage.removeItem('jwt_token');
                    window.location.href = '/';
                    return;
                }

                const user = decodedjwt.contents;
                setUserId(user.id || '');
            } catch (error) {
                setMessage('Failed to verify authentication');
                console.error('JWT check error:', error);
            }
        }

        initializeUser();
    }, []);

    async function confirmAddClass(event: React.FormEvent) : Promise<void>
        {
            event.preventDefault();

            // Mark all fields as touched
            setTouched({
                classCode: true,
                section: true
            });

            // Validate all fields
            const isClassCodeValid = validateClassCodeField();
            const isSectionValid = validateSectionField();

            if (!isClassCodeValid || !isSectionValid) {
                setMessage('Please fix all errors before submitting');
                return;
            }

            try {
                const obj = { 
                    userId: userId, 
                    classCode: classCode,
                    section: classSection
                };
                const js = JSON.stringify(obj);
                const url = buildPath('api/joinclass');
                //console.log('Add Class URL:', url); // Debug

                const response = await fetch(url, {
                    method: 'POST',
                    body: js,
                    headers: { 'Content-Type': 'application/json' }
                });
            
                const res = JSON.parse(await response.text());
                if (res.error != '') {
                    throw new Error(res.error || 'Add Class failed');
                }
                else{
                    setMessage('Class Added successfully!');
                }
                
                
            }
            catch (error: any) {
                setMessage(error.message || 'Add Class failed');
            }
            
        }
    return (
        <div id="AddclassWrapper" className={styles.cardWrapper}>
            <div id="loginDiv">
                <span id="inner-title" className={styles.cardTitle}>Join a Class</span><br />
                <div id="classCodeInput" className={styles.inputRow}>
                    <label className={styles.inputLabel} htmlFor="classCode">Class Code:</label>
                    <input 
                        type="text" 
                        id="classCode" 
                        placeholder="ABC1234" 
                        className={`${styles.textInput} ${touched.classCode && errors.classCode ? styles.inputError : ''}`}
                        onChange={handleSetClassCode}
                        onBlur={() => handleBlur('classCode')}
                    />
                    {touched.classCode && errors.classCode && (
                        <span className={styles.errorMessage}>{errors.classCode}</span>
                    )}
                </div>
                <div id="classSectionInput" className={styles.inputRow}>
                    <label className={styles.inputLabel} htmlFor="classSection">Class Section:</label>
                    <input 
                        type="text" 
                        id="classSection" 
                        placeholder="Section" 
                        className={`${styles.textInput} ${touched.section && errors.section ? styles.inputError : ''}`}
                        onChange={handleSetClassSection}
                        onBlur={() => handleBlur('section')}
                    />
                    {touched.section && errors.section && (
                        <span className={styles.errorMessage}>{errors.section}</span>
                    )}
                </div>
                


                <input type="submit" id="submitButton" className={styles.buttons} value = "Add Class"
                onClick={confirmAddClass} />
                {message && (
                    <div id="registerResult" className={`${styles.resultMessage} ${message.includes('successfully') ? styles.success : styles.error}`}>
                        {message}
                    </div>
                )}
                <br />
            </div>
        </div>
    );

    function handleSetClassCode(event: React.ChangeEvent<HTMLInputElement>) {
        setClassCode(event.target.value);
        if (touched.classCode) validateClassCodeField();
    }

    function handleSetClassSection(event: React.ChangeEvent<HTMLInputElement>) {
        setClassSection(event.target.value);
        if (touched.section) validateSectionField();
    }

};



export default JoinClass;