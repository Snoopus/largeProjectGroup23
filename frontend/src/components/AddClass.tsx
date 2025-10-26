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
    
    useEffect(() => {
        const userData = localStorage.getItem('user_data');
        
        if (userData) {
          const user = JSON.parse(userData);
            setUserFirstName(user.firstName || 'User');
            setUserLastName(user.lastName || '');
            setUserRole(user.role || '');
            setUserId(user.id || '');
        }
      }, []);

    async function confirmAddClass(event: React.FormEvent) : Promise<void>
        {
            event.preventDefault();

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
                        <input type="text" id="className" placeholder="Class Name" className={styles.textInput} onChange={handleSetClassName} />
                    </div>
                    <div id="classCodeInput" className={styles.inputRow}>
                        <label className={styles.inputLabel} htmlFor="classCode">Class Code:</label>
                        <input type="text" id="classCode" placeholder="COP4331" className={styles.textInput} onChange={handleSetClassCode} />
                    </div>
                    <div id="sectionInput" className={styles.inputRow}>
                        <label className={styles.inputLabel} htmlFor="section">Section:</label>
                        <input type="text" id="section" placeholder="2" className={styles.textInput} onChange={handleSetSection} />
                    </div>
                    <div id="classDurationInput" className={styles.inputRow}>
                        <label className={styles.inputLabel} htmlFor="classDuration">Class Duration (minutes):</label>
                        <input type="number" id="classDuration" placeholder="Duration in minutes" className={styles.textInput} onChange={handleSetClassDuration} />
                    </div>
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
                    </div>
                    <div id="startTimeInput" className={styles.inputRow}>
                        <label className={styles.inputLabel} htmlFor="startTime">Start Time:</label>
                        <input type="time" id="startTime" placeholder="08:00" className={styles.textInput} onChange={handleSetStartTime} />
                    </div>
                    <div id="endTimeInput" className={styles.inputRow}>
                        <label className={styles.inputLabel} htmlFor="endTime">End Time:</label>
                        <input type="time" id="endTime" placeholder="10:00" className={styles.textInput} onChange={handleSetEndTime} />
                    </div>
                    


                    <input type="submit" id="submitButton" className={styles.buttons} value = "Add Class"
                    onClick={confirmAddClass} />
                    <div id="registerResult">{message}</div>
                    <br />
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
        setClassName(event.target.value);
    }

    function handleSetClassCode(event: React.ChangeEvent<HTMLInputElement>) {
        setClassCode(event.target.value);
    }

    function handleSetSection(event: React.ChangeEvent<HTMLInputElement>) {
        setSection(event.target.value);
    }

    function handleSetClassDuration(event: React.ChangeEvent<HTMLInputElement>) {
        setClassDuration(Number(event.target.value));
    }

    function handleDayChange(day: 'M' | 'T' | 'W' | 'Th' | 'F', isChecked: boolean) {
        setSelectedDays(prev => ({
            ...prev,
            [day]: isChecked
        }));
    }

    function handleSetStartTime(event: React.ChangeEvent<HTMLInputElement>) {
        setStartTime(event.target.value);
    }

    function handleSetEndTime(event: React.ChangeEvent<HTMLInputElement>) {
        setEndTime(event.target.value);
    }

};



export default AddClass;