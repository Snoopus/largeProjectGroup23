import LoginStyles from '../css/Login.module.css';
import generalStyles from '../css/General.module.css';
import { useState, useEffect } from 'react';
import { buildPath } from '../services/buildPath';

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

function AddClass()
{
    const [userFirstName, setUserFirstName] = useState('');
    const [userLastName, setUserLastName] = useState('');
    const [userRole, setUserRole] = useState('');
    const [userId, setUserId] = useState('');
    const [message,setMessage] = useState('');
    const [className, setClassName] = useState('');
    const [classCode, setClassCode] = useState('');
    const [section, setSection] = useState('');
    const [classDuration, setClassDuration] = useState(0);
    const [selectedDays, setSelectedDays] = useState({
        M: false,
        T: false,
        W: false,
        Th: false,
        F: false
    });
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    
    // Validation error states
    const [errors, setErrors] = useState({
        className: '',
        classCode: '',
        section: '',
        daysOffered: '',
        startTime: '',
        endTime: ''
    });

    // Track which fields have been touched (focused and then blurred)
    const [touched, setTouched] = useState({
        className: false,
        classCode: false,
        section: false,
        daysOffered: false,
        startTime: false,
        endTime: false
    });
    
    useEffect(() => {
        async function initializeUser() {
            // Get JWT token from localStorage
            const jwt = localStorage.getItem('jwt_token');
            if (!jwt) {
                setMessage('Please log in to add a class');
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
                setUserFirstName(user.firstName || 'User');
                setUserLastName(user.lastName || '');
                setUserRole(user.role || '');
                setUserId(user.id || '');
            } catch (error) {
                setMessage('Failed to verify authentication');
                console.error('JWT check error:', error);
            }
        }

        initializeUser();
    }, []);

    // Compute duration whenever start or end time changes
    useEffect(() => {
        if (startTime && endTime) {
            const duration = calculateDuration(startTime, endTime);
            setClassDuration(duration);
        }
    }, [startTime, endTime]);

    // Calculate duration in minutes from start and end times (HH:MM format)
    function calculateDuration(start: string, end: string): number {
        if (!start || !end) return 0;
        
        // Parse time strings (format: "HH:MM")
        const [startHours, startMinutes] = start.split(':').map(Number);
        const [endHours, endMinutes] = end.split(':').map(Number);
        
        // Convert to total minutes
        const startTotalMinutes = startHours * 60 + startMinutes;
        const endTotalMinutes = endHours * 60 + endMinutes;
        
        // Calculate difference
        let duration = endTotalMinutes - startTotalMinutes;
        
        // Handle case where end time is on the next day (e.g., night class)
        if (duration < 0) {
            duration += 24 * 60; // Add 24 hours worth of minutes
        }
        
        return duration;
    }

    // Validation functions
    function validateClassName(value: string): string {
        if (!value.trim()) return 'Class name is required';
        if (value.trim().length < 3) return 'Class name must be at least 3 characters';
        return '';
    }

    function validateClassCode(value: string): string {
        if (!value.trim()) return 'Class code is required';
        if (!/^[A-Z]{3}\d{4}$/i.test(value.trim())) return 'Class code must be 3 letters followed by 4 numbers (e.g., COP4331)';
        return '';
    }

    function validateSection(value: string): string {
        if (!value.trim()) return 'Section is required';
        return '';
    }

    function validateDaysOffered(): string {
        const hasSelectedDay = Object.values(selectedDays).some(day => day);
        if (!hasSelectedDay) return 'Please select at least one day';
        return '';
    }

    function validateStartTime(value: string): string {
        if (!value) return 'Start time is required';
        return '';
    }

    function validateEndTime(value: string, start: string): string {
        if (!value) return 'End time is required';
        if (start && value) {
            const duration = calculateDuration(start, value);
            if (duration <= 0) return 'End time must be after start time';
            if (duration < 15) return 'Class must be at least 15 minutes long';
        }
        return '';
    }

    // Validate individual field and update errors
    function validateField(fieldName: string, value?: string) {
        let error = '';
        
        switch(fieldName) {
            case 'className':
                error = validateClassName(value || className);
                break;
            case 'classCode':
                error = validateClassCode(value || classCode);
                break;
            case 'section':
                error = validateSection(value || section);
                break;
            case 'daysOffered':
                error = validateDaysOffered();
                break;
            case 'startTime':
                error = validateStartTime(value || startTime);
                break;
            case 'endTime':
                error = validateEndTime(value || endTime, startTime);
                break;
        }
        
        setErrors(prev => ({ ...prev, [fieldName]: error }));
        return error === '';
    }

    // Validate all fields
    function validateAllFields(): boolean {
        const newErrors = {
            className: validateClassName(className),
            classCode: validateClassCode(classCode),
            section: validateSection(section),
            daysOffered: validateDaysOffered(),
            startTime: validateStartTime(startTime),
            endTime: validateEndTime(endTime, startTime)
        };
        
        setErrors(newErrors);
        
        // Mark all fields as touched
        setTouched({
            className: true,
            classCode: true,
            section: true,
            daysOffered: true,
            startTime: true,
            endTime: true
        });
        
        // Return true if no errors
        return Object.values(newErrors).every(error => error === '');
    }

    // Handle blur events (when user leaves a field)
    function handleBlur(fieldName: string) {
        setTouched(prev => ({ ...prev, [fieldName]: true }));
        validateField(fieldName);
    }

    async function confirmAddClass(event: React.FormEvent) : Promise<void>
        {
            event.preventDefault();

            // Validate all fields before submitting
            if (!validateAllFields()) {
                setMessage('Please fix all errors before submitting');
                return;
            }

            setClassDuration(calculateDuration(startTime, endTime));

            try {
                // Create days string from selected days (e.g., "MWF" or "MTThF")
                const daysString = Object.entries(selectedDays)
                    .filter(([, isSelected]) => isSelected)
                    .map(([day]) => day)
                    .join('');

                // Register the user
                const instructorName:string = userFirstName + ' ' + userLastName;
                const obj = { 
                    name: className, 
                    classCode: classCode,
                    section: section,
                    duration: classDuration, 
                    instructorId: userId,
                    instructorName: instructorName,
                    daysOffered: daysString,
                    startTime: startTime,
                    endTime: endTime
                };
                const js = JSON.stringify(obj);
                const url = buildPath('api/createclass');
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

    if(userRole === "teacher"){
        return (
            <div id="AddclassWrapper" className={styles.cardWrapper}>
                <div id="loginDiv">
                    <span id="inner-title" className={styles.cardTitle}>Add a Class</span><br />
                    <div id="classNameInput" className={styles.inputRow}>
                        <label className={styles.inputLabel} htmlFor="className">Class Name:</label>
                        <input 
                            type="text" 
                            id="className" 
                            placeholder="Class Name" 
                            className={`${styles.textInput} ${touched.className && errors.className ? styles.inputError : ''}`}
                            onChange={handleSetClassName}
                            onBlur={() => handleBlur('className')}
                            value={className}
                        />
                        {touched.className && errors.className && (
                            <span className={styles.errorMessage}>{errors.className}</span>
                        )}
                    </div>
                    <div id="classCodeInput" className={styles.inputRow}>
                        <label className={styles.inputLabel} htmlFor="classCode">Class Code:</label>
                        <input 
                            type="text" 
                            id="classCode" 
                            placeholder="COP4331" 
                            className={`${styles.textInput} ${touched.classCode && errors.classCode ? styles.inputError : ''}`}
                            onChange={handleSetClassCode}
                            onBlur={() => handleBlur('classCode')}
                            value={classCode}
                        />
                        {touched.classCode && errors.classCode && (
                            <span className={styles.errorMessage}>{errors.classCode}</span>
                        )}
                    </div>
                    <div id="sectionInput" className={styles.inputRow}>
                        <label className={styles.inputLabel} htmlFor="section">Section:</label>
                        <input 
                            type="text" 
                            id="section" 
                            placeholder="2" 
                            className={`${styles.textInput} ${touched.section && errors.section ? styles.inputError : ''}`}
                            onChange={handleSetSection}
                            onBlur={() => handleBlur('section')}
                            value={section}
                        />
                        {touched.section && errors.section && (
                            <span className={styles.errorMessage}>{errors.section}</span>
                        )}
                    </div>
                    {/* <div id="classDurationInput" className={styles.inputRow}>
                        <label className={styles.inputLabel} htmlFor="classDuration">Class Duration (minutes):</label>
                        <input type="number" id="classDuration" placeholder="Duration in minutes" className={styles.textInput} onChange={handleSetClassDuration} />
                    </div> */}
                    <div id="daysOfferedInput" className={styles.inputRow}>
                        <label className={styles.inputLabel}>Days Offered:</label>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <label>
                                <input 
                                    type="checkbox" 
                                    checked={selectedDays.M}
                                    onChange={(e) => handleDayChange('M', e.target.checked)}
                                /> M
                            </label>
                            <label>
                                <input 
                                    type="checkbox" 
                                    checked={selectedDays.T}
                                    onChange={(e) => handleDayChange('T', e.target.checked)}
                                /> T
                            </label>
                            <label>
                                <input 
                                    type="checkbox" 
                                    checked={selectedDays.W}
                                    onChange={(e) => handleDayChange('W', e.target.checked)}
                                /> W
                            </label>
                            <label>
                                <input 
                                    type="checkbox" 
                                    checked={selectedDays.Th}
                                    onChange={(e) => handleDayChange('Th', e.target.checked)}
                                /> Th
                            </label>
                            <label>
                                <input 
                                    type="checkbox" 
                                    checked={selectedDays.F}
                                    onChange={(e) => handleDayChange('F', e.target.checked)}
                                /> F
                            </label>
                        </div>
                        {touched.daysOffered && errors.daysOffered && (
                            <span className={styles.errorMessage}>{errors.daysOffered}</span>
                        )}
                    </div>
                    <div id="startTimeInput" className={styles.inputRow}>
                        <label className={styles.inputLabel} htmlFor="startTime">Start Time:</label>
                        <input 
                            type="time" 
                            id="startTime" 
                            placeholder="08:00" 
                            className={`${styles.textInput} ${touched.startTime && errors.startTime ? styles.inputError : ''}`}
                            onChange={handleSetStartTime}
                            onBlur={() => handleBlur('startTime')}
                            value={startTime}
                        />
                        {touched.startTime && errors.startTime && (
                            <span className={styles.errorMessage}>{errors.startTime}</span>
                        )}
                    </div>
                    <div id="endTimeInput" className={styles.inputRow}>
                        <label className={styles.inputLabel} htmlFor="endTime">End Time:</label>
                        <input 
                            type="time" 
                            id="endTime" 
                            placeholder="10:00" 
                            className={`${styles.textInput} ${touched.endTime && errors.endTime ? styles.inputError : ''}`}
                            onChange={handleSetEndTime}
                            onBlur={() => handleBlur('endTime')}
                            value={endTime}
                        />
                        {touched.endTime && errors.endTime && (
                            <span className={styles.errorMessage}>{errors.endTime}</span>
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
    }
    else{
        return( //what gets put in the page when added. DO NOT USE FORM TAGS
        <div id = "AddclassWrapper" className={styles.cardWrapper}>
            Student<br />
        </div>
        );
    }

    function handleSetClassName(event: React.ChangeEvent<HTMLInputElement>) {
        const value = event.target.value;
        setClassName(value);
        // Only validate if field has been touched
        if (touched.className) {
            validateField('className', value);
        }
    }

    function handleSetClassCode(event: React.ChangeEvent<HTMLInputElement>) {
        const value = event.target.value;
        setClassCode(value);
        if (touched.classCode) {
            validateField('classCode', value);
        }
    }

    function handleSetSection(event: React.ChangeEvent<HTMLInputElement>) {
        const value = event.target.value;
        setSection(value);
        if (touched.section) {
            validateField('section', value);
        }
    }

    function handleSetClassDuration(event: React.ChangeEvent<HTMLInputElement>) {
        setClassDuration(Number(event.target.value));
    }

    function handleDayChange(day: 'M' | 'T' | 'W' | 'Th' | 'F', isChecked: boolean) {
        setSelectedDays(prev => ({
            ...prev,
            [day]: isChecked
        }));
        // Mark as touched when user interacts with checkboxes
        setTouched(prev => ({ ...prev, daysOffered: true }));
        // Validate after state update
        setTimeout(() => validateField('daysOffered'), 0);
    }

    function handleSetStartTime(event: React.ChangeEvent<HTMLInputElement>) {
        const value = event.target.value;
        setStartTime(value);
        if (touched.startTime) {
            validateField('startTime', value);
        }
        // Also revalidate end time if it's been set
        if (endTime && touched.endTime) {
            setTimeout(() => validateField('endTime'), 0);
        }
    }

    function handleSetEndTime(event: React.ChangeEvent<HTMLInputElement>) {
        const value = event.target.value;
        setEndTime(value);
        if (touched.endTime) {
            validateField('endTime', value);
        }
    }

};



export default AddClass;