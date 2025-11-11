import LoginStyles from '../css/Login.module.css';
import generalStyles from '../css/General.module.css';
import { useState } from 'react';
import { loginUser } from '../services/authService';
import { validateEmail, validateRequired } from '../utils/validation';

// Merge both style objects - loginStyles will override generalStyles if there are conflicts
const styles = { ...generalStyles, ...LoginStyles };


function Login()
{
    const [message,setMessage] = useState(''); //this is a setter, message is the variable and setMessage is the function to set it
    const [loginName,setLoginName] = useState('');
    const [loginPassword,setPassword] = useState('');
    const [errors, setErrors] = useState({ loginName: '', loginPassword: '' });
    const [touched, setTouched] = useState({ loginName: false, loginPassword: false });
    
    function validateLoginName(value: string): void {
        const result = validateEmail(value);
        setErrors(prev => ({ ...prev, loginName: result.error }));
    }

    function validateLoginPassword(value: string): void {
        const result = validateRequired(value, 'Password');
        setErrors(prev => ({ ...prev, loginPassword: result.error }));
    }

    function handleBlur(field: 'loginName' | 'loginPassword'): void {
        setTouched(prev => ({ ...prev, [field]: true }));
        if (field === 'loginName') {
            validateLoginName(loginName);
        } else {
            validateLoginPassword(loginPassword);
        }
    }

    async function doLogin(event: React.FormEvent) : Promise<void>
    {
        event.preventDefault();

        // Validate all fields before submitting
        const emailResult = validateEmail(loginName);
        const passwordResult = validateRequired(loginPassword, 'Password');

        setErrors({
            loginName: emailResult.error,
            loginPassword: passwordResult.error
        });

        setTouched({
            loginName: true,
            loginPassword: true
        });

        if (!emailResult.isValid || !passwordResult.isValid) {
            setMessage('Please fix all errors before logging in');
            return;
        }
  
        try
        {    
            await loginUser(loginName, loginPassword);
            setMessage('');
            const userData = localStorage.getItem('user_data');
            if(userData) {
                const user = JSON.parse(userData);
                if(user.role === "teacher") {
                    window.location.href = '/classes';
                    return;
                }
                else {
                    window.location.href = '/classes';
                    return;
                }
                //window.location.href = '/classes';
            }
            window.location.href = '/';
        }
        catch(error: unknown)
        {
            const errorMessage = error instanceof Error ? error.message : 'Login failed';
            setMessage(errorMessage);
        }    
      };

    return( //what gets put in the page when added. DO NOT USE FORM TAGS
        <div id="loginWrapper" className={styles.cardWrapper}>
            <div id="loginDiv">
                <span id="inner-title" className={styles.cardTitle}>PLEASE LOG IN</span><br />
                <div className={styles.inputRow}>
                    <input 
                        type="text" 
                        id="loginName" 
                        placeholder="Email" 
                        className={`${styles.textInput} ${touched.loginName && errors.loginName ? styles.inputError : ''}`}
                        onChange={handleSetLoginName}
                        onBlur={() => handleBlur('loginName')}
                        value={loginName}
                    />
                    {touched.loginName && errors.loginName && (
                        <span className={styles.errorMessage}>{errors.loginName}</span>
                    )}
                </div>
                <div className={styles.inputRow}>
                    <input 
                        type="password" 
                        id="loginPassword" 
                        placeholder="Password" 
                        className={`${styles.textInput} ${touched.loginPassword && errors.loginPassword ? styles.inputError : ''}`}
                        onChange={handleSetPassword}
                        onBlur={() => handleBlur('loginPassword')}
                        value={loginPassword}
                    />
                    {touched.loginPassword && errors.loginPassword && (
                        <span className={styles.errorMessage}>{errors.loginPassword}</span>
                    )}
                </div>
                <input type="submit" id="loginButton" className={styles.buttons} value = "Do It"
                onClick={doLogin} />
                {message && (
                    <div id="loginResult" className={`${styles.resultMessage} ${styles.error}`}>
                        {message}
                    </div>
                )}
                <br />
                <br />
                <div id="registerText" className={styles.registerText}>
                    Not registered? <a  href="/register">Register</a>
                </div>
                <br />
                <div id="forgotPassword" className={styles.registerText}>
                    Forgot your password? <a  href="/forgotpassword">Reset Password</a>
                </div>
            </div>
        </div>
    );
    function handleSetLoginName( e: React.ChangeEvent<HTMLInputElement> ) : void
    {
        const value = e.target.value;
        setLoginName(value);
        if (touched.loginName) {
            validateLoginName(value);
        }
    }
    function handleSetPassword( e: React.ChangeEvent<HTMLInputElement> ) : void
    {
        const value = e.target.value;
        setPassword(value);
        if (touched.loginPassword) {
            validateLoginPassword(value);
        }
    }
    
};

export default Login;

