import LoginStyles from '../css/Login.module.css';
import generalStyles from '../css/General.module.css';
import { useState, useEffect } from 'react';
import { buildPath } from '../services/buildPath';

// Merge both style objects - loginStyles will override generalStyles if there are conflicts
const styles = { ...generalStyles, ...LoginStyles };

function EnterCode()
{

    const [message,setMessage] = useState('');
    const [verificationCode, setVerificationCode] = useState('');

    useEffect(() => {
        sendCode();
    }, []);

    function sendCode() : void
    {
        // Logic to send code to user's email or phone
        setMessage('Verification code sent!');
    }

    function verifyCode(event: React.FormEvent) : void
    {
        event.preventDefault();
        // Logic to verify the code
        setMessage('Code verified successfully!');
    }

    

    return (
        <div id="AddclassWrapper" className={styles.cardWrapper}>
            <div id="loginDiv">
                {/* <div id="sendCodeDiv" className = {styles.inputRow}>
                    <input type="submit" id="sendCode" className={styles.buttons} value = "Send Code"
                    onClick={sendCode} />
                </div> */}
                <span id="inner-title" className={styles.cardTitle}>Enter verification code</span><br />
                <div id="classCodeInput" className={styles.inputRow}>
                    <label className={styles.inputLabel} htmlFor="classCode">Verification code:</label>
                    <input type="text" id="classCode" placeholder="Ex: 109922" className={styles.textInput} onChange={handleSetVerificationCode} />
                </div>
                


                <input type="submit" id="submitButton" className={styles.buttons} value = "Submit Code"
                onClick={verifyCode} />
                <div id="registerResult">{message}</div>
                <br />
                <br />
            </div>
        </div>
    );

    function handleSetVerificationCode(event: React.ChangeEvent<HTMLInputElement>) {
        setVerificationCode(event.target.value);
    }
}



export default EnterCode;