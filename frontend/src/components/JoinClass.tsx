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

function JoinClass()
{
    const [userId, setUserId] = useState('');
    const [classCode, setClassCode] = useState('');
    const [classSection, setClassSection] = useState('');
    const [message,setMessage] = useState('');
    
    useEffect(() => {
        const userData = localStorage.getItem('user_data');
        
        if (userData) {
          const user = JSON.parse(userData);
            setUserId(user.id || '');
        }
      }, []);

    async function confirmAddClass(event: React.FormEvent) : Promise<void>
        {
            event.preventDefault();

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
                <span id="inner-title" className={styles.cardTitle}>Add a Class</span><br />
                <div id="classCodeInput" className={styles.inputRow}>
                    <label className={styles.inputLabel} htmlFor="classCode">Class Code:</label>
                    <input type="text" id="classCode" placeholder="Class Code" className={styles.textInput} onChange={handleSetClassCode} />
                </div>
                <div id="classSectionInput" className={styles.inputRow}>
                    <label className={styles.inputLabel} htmlFor="classSection">Class Section:</label>
                    <input type="text" id="classSection" placeholder="Section" className={styles.textInput} onChange={handleSetClassSection} />
                </div>
                


                <input type="submit" id="submitButton" className={styles.buttons} value = "Add Class"
                onClick={confirmAddClass} />
                <div id="registerResult">{message}</div>
                <br />
                <br />
            </div>
        </div>
    );

    function handleSetClassCode(event: React.ChangeEvent<HTMLInputElement>) {
        setClassCode(event.target.value);
    }

    function handleSetClassSection(event: React.ChangeEvent<HTMLInputElement>) {
        setClassSection(event.target.value);
    }

};



export default JoinClass;