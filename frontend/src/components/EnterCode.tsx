import LoginStyles from '../css/Login.module.css';
import generalStyles from '../css/General.module.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildPath } from '../services/buildPath';
import { registerUser } from '../services/authService';
import { validateVerificationCode } from '../utils/validation';

// Merge both style objects - loginStyles will override generalStyles if there are conflicts
const styles = { ...generalStyles, ...LoginStyles };

interface EnterCodeProps {
    mode: 'registration' | 'passwordReset';
}

function EnterCode({ mode }: EnterCodeProps) {
    const [message, setMessage] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    // Validation state
    const [errors, setErrors] = useState({ verificationCode: '' });
    const [touched, setTouched] = useState({ verificationCode: false });

    // Validation function
    const validateVerificationCodeField = () => {
        const result = validateVerificationCode(verificationCode);
        setErrors(prev => ({ ...prev, verificationCode: result.error }));
        return result.isValid;
    };

    const handleBlur = () => {
        setTouched({ verificationCode: true });
        validateVerificationCodeField();
    };

    // Get email from navigation state (passed from Register or ForgotPassword page)
    useEffect(() => {
        const userData = localStorage.getItem('registration_data');
    
        if (userData) {
        const user = JSON.parse(userData);
        setEmail(user.email);
        }
        else{
            setMessage('Error: No email provided. Please try again.');
        }
    }, []);

    async function sendEmailCode(event: React.FormEvent): Promise<void> {
        event.preventDefault();
        const emailAddress = email;
        
        if (!emailAddress) {
            setMessage('Email not found. Please restart the process.');
            return;
        }
        
        try {
                const obj = { 
                    email: emailAddress,
                    templateChoice: mode === 'registration' ? 'registration' : 'passwordReset'
                };
                const js = JSON.stringify(obj);
                const url = buildPath('api/sendEmailCode');

                const response = await fetch(url, {
                    method: 'POST',
                    body: js,
                    headers: { 'Content-Type': 'application/json' }
                });

                const res = await response.json();

                if (res.error && res.error !== '') {
                    throw new Error(res.error);
                }

                setMessage('Verification code sent successfully!');
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : 'Verification failed';
                setMessage(errorMessage);
            } finally {
                setIsLoading(false);
            }  
    }
    
    // Text content based on mode
    const title = mode === 'registration' 
        ? 'Verify Your Email' 
        : 'Reset Your Password';
    
    const description = mode === 'registration'
        ? 'Enter the 6-digit code sent to your email to complete registration'
        : 'Enter the 6-digit password reset code sent to your email';

    async function verifyCode(event: React.FormEvent): Promise<void> {
        event.preventDefault();
        
        // Mark field as touched
        setTouched({ verificationCode: true });

        // Validate verification code
        const isCodeValid = validateVerificationCodeField();
        
        if (!isCodeValid) {
            setMessage('Please enter a valid 6-digit code');
            return;
        }

        if (!email) {
            setMessage('Email not found. Please restart the process.');
            return;
        }

        setIsLoading(true);
        setMessage('');

        try {
            const obj = { 
                email: email,
                verificationCode: verificationCode
            };
            const js = JSON.stringify(obj);
            const url = buildPath('api/verifyEmailCode');

            const response = await fetch(url, {
                method: 'POST',
                body: js,
                headers: { 'Content-Type': 'application/json' }
            });

            const res = await response.json();

            if (res.error && res.error !== '') {
                throw new Error(res.error);
            }

            // Success - navigate based on mode
            if (mode === 'registration') {
                const userData = localStorage.getItem('registration_data');
                if (userData) {
                    const user = JSON.parse(userData);
                    registerUser(user.email, user.password, user.firstName, user.lastName, user.id, user.role);
                    setMessage('Email verified successfully! Redirecting to login...');
                    localStorage.removeItem('registration_data');
                    setTimeout(() => {
                        navigate('/');
                    }, 2000);
                }
                else{
                    setMessage('Error: Registration data not found. Please try again.');
                    localStorage.removeItem('registration_data');
                    setTimeout(() => {
                        navigate('/register');
                    }, 2000);
                }
            } else {
                setMessage('Code verified! Redirecting to password reset...');
                setTimeout(() => {
                    navigate('/changepassword');
                }, 2000);
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Verification failed';
            setMessage(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }



    function handleSetVerificationCode(event: React.ChangeEvent<HTMLInputElement>) {
        // Only allow digits and limit to 6 characters
        const value = event.target.value.replace(/\D/g, '').slice(0, 6);
        setVerificationCode(value);
        if (touched.verificationCode) validateVerificationCodeField();
    }

    return (
        <div id="AddclassWrapper" className={styles.cardWrapper}>
            <div id="loginDiv">
                <span id="inner-title" className={styles.cardTitle}>{title}</span><br />
                <p className={styles.inputLabel}>{description}</p>
                {email && (
                    <p className={styles.inputLabel}>Sending code to: {email}</p>
                )}

                <button
                    type="button"
                    className={styles.buttons}
                    onClick={sendEmailCode}
                    disabled={isLoading || !email}
                >
                    Send Code
                </button>

                <div id="classCodeInput" className={styles.inputRow}>
                    <label className={styles.inputLabel} htmlFor="classCode">Verification code:</label>
                    <input 
                        type="text" 
                        id="classCode" 
                        placeholder="000000" 
                        className={`${styles.textInput} ${touched.verificationCode && errors.verificationCode ? styles.inputError : ''}`}
                        value={verificationCode}
                        onChange={handleSetVerificationCode}
                        onBlur={handleBlur}
                        maxLength={6}
                        disabled={isLoading}
                        autoComplete="off"
                    />
                    {touched.verificationCode && errors.verificationCode && (
                        <span className={styles.errorMessage}>{errors.verificationCode}</span>
                    )}
                </div>                <button
                    type="submit"
                    className={styles.buttons}
                    onClick={verifyCode}
                    disabled={isLoading || !email}
                >
                    {isLoading ? "Verifying..." : "Verify Code"}
                </button>
                
                {message && (
                    <div id="registerResult" className={`${styles.resultMessage} ${
                        message.includes('successfully') || message.includes('verified') || message.includes('Redirecting') 
                            ? styles.success 
                            : message.includes('sent')
                            ? styles.info
                            : styles.error
                    }`}>
                        {message}
                    </div>
                )}

                <br />
            </div>
        </div>
    );

}

export default EnterCode;