import LoginStyles from '../css/Login.module.css';
import generalStyles from '../css/General.module.css';
import { useState } from 'react';
import { loginUser } from '../services/authService';

// Merge both style objects - loginStyles will override generalStyles if there are conflicts
const styles = { ...generalStyles, ...LoginStyles };


function AddClass()
{

    return( //what gets put in the page when added. DO NOT USE FORM TAGS
        <div id = "pageWrapper" className={styles.cardWrapper}>
            Add a class<br />
        </div>
    );
    
};

export default AddClass;