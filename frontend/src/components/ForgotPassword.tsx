import LoginStyles from '../css/Login.module.css';
import generalStyles from '../css/General.module.css';
import { useState, useEffect } from 'react';
import { buildPath } from '../services/buildPath';
import { useNavigate } from 'react-router-dom';

// Merge both style objects - loginStyles will override generalStyles if there are conflicts
const styles = { ...generalStyles, ...LoginStyles };

function ForgotPassword()
{
    const [email, setEmail] = useState('');
    const [message,setMessage] = useState('');
    const navigate = useNavigate();

    function isValidEmail(email: string): boolean {
        // RFC 5322 compliant email regex (simplified version)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    async function confirmResetPassword(event: React.FormEvent) : Promise<void>
    {
        event.preventDefault();
        
        // Validate email format
        if (!email || !isValidEmail(email)) {
            setMessage('Please enter a valid email address');
            return;
        }

        try {
            const obj = { 
                    email: email
                };
                const js = JSON.stringify(obj);
                const url = buildPath('api/findExistingUser');

                const response = await fetch(url, {
                    method: 'POST',
                    body: js,
                    headers: { 'Content-Type': 'application/json' }
                });

                const res = await response.json();

                if (res.error && res.error !== '') {
                    throw new Error(res.error);
                }

                const registrationInfo = { 
                    email: email
                };
                localStorage.setItem('registration_data', JSON.stringify(registrationInfo));
                navigate('/verification?type=reset');
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : 'Verification failed';
                setMessage(errorMessage);
                return;
            }

            
    }   

    return (
        <div id="enterEmailWrapper" className={styles.cardWrapper}>
            <div id="loginDiv">
                <span id="inner-title" className={styles.cardTitle}>Enter Email to Reset Password</span><br />
                <div id="emailInput" className={styles.inputRow}>
                    <label className={styles.inputLabel} htmlFor="email">Email:</label>
                    <input type="email" id="email" placeholder="Email" className={styles.textInput} onChange={(e) => setEmail(e.target.value)} required />
                </div>

                <input type="submit" id="submitButton" className={styles.buttons} value = "Reset Password"
                onClick={confirmResetPassword} />
                <div id="resetResult">{message}</div>
                <br />
                <br />
            </div>
        </div>
    );

    

};



export default ForgotPassword;