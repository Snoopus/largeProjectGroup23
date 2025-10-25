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
    const [classDuration, setClassDuration] = useState(0);
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

    async function confirmAddClass(event:any) : Promise<void>
        {
            event.preventDefault();

            try {
                // Register the user
                const instructorName:string = userFirstName + ' ' + userLastName;
                const obj = { name: className, duration: classDuration, instructorId: userId , instructorName: instructorName};
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
                    <div id="classDurationInput" className={styles.inputRow}>
                        <label className={styles.inputLabel} htmlFor="classDuration">Class Duration (minutes):</label>
                        <input type="number" id="classDuration" placeholder="Duration in minutes" className={styles.textInput} onChange={handleSetClassDuration} />
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

    function handleSetClassName(event:any) {
        setClassName(event.target.value);
    }

    function handleSetClassDuration(event:any) {
        setClassDuration(Number(event.target.value));
    }

};



export default AddClass;