import LoginStyles from '../css/Login.module.css';
import generalStyles from '../css/General.module.css';
import { useState, useEffect } from 'react';
import { buildPath } from '../services/buildPath';
import { useNavigate } from 'react-router-dom';
import { validateEmail } from '../utils/validation';

// Merge both style objects - loginStyles will override generalStyles if there are conflicts
const styles = { ...generalStyles, ...LoginStyles };

function ForgotPassword()
{
    const [email, setEmail] = useState('');
    const [message,setMessage] = useState('');
    const navigate = useNavigate();

    // Validation state
    const [errors, setErrors] = useState({ email: '' });
    const [touched, setTouched] = useState({ email: false });

    // Validation function
    const validateEmailField = () => {
        const result = validateEmail(email);
        setErrors(prev => ({ ...prev, email: result.error }));
        return result.isValid;
    };

    const handleBlur = () => {
        setTouched({ email: true });
        validateEmailField();
    };

    const handleSetEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
        if (touched.email) validateEmailField();
    };

    async function confirmResetPassword(event: React.FormEvent) : Promise<void>
    {
        event.preventDefault();
        
        // Mark field as touched
        setTouched({ email: true });

        // Validate email
        const isEmailValid = validateEmailField();
        
        if (!isEmailValid) {
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
                    <input 
                        type="email" 
                        id="email" 
                        placeholder="johnDoe@example.com" 
                        className={`${styles.textInput} ${touched.email && errors.email ? styles.inputError : ''}`}
                        onChange={handleSetEmail}
                        onBlur={handleBlur}
                        required 
                    />
                    {touched.email && errors.email && (
                        <span className={styles.errorMessage}>{errors.email}</span>
                    )}
                </div>

                <input type="submit" id="submitButton" className={styles.buttons} value = "Reset Password"
                onClick={confirmResetPassword} />
                {message && (
                    <div id="resetResult" className={`${styles.resultMessage} ${styles.error}`}>
                        {message}
                    </div>
                )}
                <br />
            </div>
        </div>
    );

    

};



export default ForgotPassword;