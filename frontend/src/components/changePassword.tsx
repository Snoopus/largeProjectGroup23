import LoginStyles from '../css/Login.module.css';
import generalStyles from '../css/General.module.css';
import { useState, useEffect } from 'react';
import { buildPath } from '../services/buildPath';
import { useNavigate } from 'react-router-dom';

// Merge both style objects - loginStyles will override generalStyles if there are conflicts
const styles = { ...generalStyles, ...LoginStyles };

function ChangePassword()
{
    const [email, setEmail] = useState('');
    const [message,setMessage] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const userData = localStorage.getItem('registration_data');
    
        if (userData) {
        const user = JSON.parse(userData);
        setEmail(user.email);
        }
        else{
            setMessage('Error: No email provided. Please try again.');
            setTimeout(() => {
                navigate('/');
            }, 2000);
        }
    }, []);

    async function confirmChangePassword(event: React.FormEvent) : Promise<void>
    {
        event.preventDefault();

        if(password !== confirmPassword) {
            setMessage('Passwords do not match');
            return;
        }
        
        

        try {
            const obj = { 
                    email: email,
                    newPassword: password
                };
                const js = JSON.stringify(obj);
                const url = buildPath('api/changepassword');

                const response = await fetch(url, {
                    method: 'POST',
                    body: js,
                    headers: { 'Content-Type': 'application/json' }
                });

                const res = await response.json();

                if (res.error && res.error !== '') {
                    throw new Error(res.error);
                }

                localStorage.removeItem('registration_data');
                setMessage('Password changed successfully! Redirecting to login...');
                setTimeout(() => {
                    navigate('/');
                }, 2000);
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : 'Verification failed';
                setMessage(errorMessage);
                return;
            }

            
    }   

    return (
        <div id="enterEmailWrapper" className={styles.cardWrapper}>
            <div id="loginDiv">
                <span id="inner-title" className={styles.cardTitle}>Enter New Password</span><br />
                <div id="passwordInput" className={styles.inputRow}>
                    <label className={styles.inputLabel} htmlFor="password">Password:</label>
                    <input type="password" id="password" placeholder="New Password" className={styles.textInput} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <div id="passwordInput" className={styles.inputRow}>
                    <label className={styles.inputLabel} htmlFor="confirmPassword">Confirm Password:</label>
                    <input type="password" id="confirmPassword" placeholder="Confirm New Password" className={styles.textInput} onChange={(e) => setConfirmPassword(e.target.value)} required />
                </div>

                <input type="submit" id="submitButton" className={styles.buttons} value = "Reset Password"
                onClick={confirmChangePassword} />
                {message && (
                    <div id="resetResult" className={`${styles.resultMessage} ${message.includes('successfully') ? styles.success : styles.error}`}>
                        {message}
                    </div>
                )}
                <br />
            </div>
        </div>
    );

    

};



export default ChangePassword;