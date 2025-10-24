import LoginStyles from '../css/Login.module.css';
import generalStyles from '../css/General.module.css';
import { useState, useEffect } from 'react';

// Merge both style objects - loginStyles will override generalStyles if there are conflicts
const styles = { ...generalStyles, ...LoginStyles };


function AddClass()
{
    const [userName, setUserName] = useState('');
    const [userRole, setUserRole] = useState('');
    useEffect(() => {
        const userData = localStorage.getItem('user_data');
        
        if (userData) {
          const user = JSON.parse(userData);
            setUserName(user.firstName || 'User');
            setUserRole(user.role || '');
        }
      }, []);

    if(userRole === "teacher"){
        return( //what gets put in the page when added. DO NOT USE FORM TAGS
            <div id = "pageWrapper" className={styles.cardWrapper}>
                Teacher<br />
            </div>
        );
    }
    else{
        return( //what gets put in the page when added. DO NOT USE FORM TAGS
        <div id = "pageWrapper" className={styles.cardWrapper}>
            Student<br />
        </div>
        );
    }
};



export default AddClass;