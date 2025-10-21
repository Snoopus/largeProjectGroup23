import registerStyles from '../css/Register.module.css';
import generalStyles from '../css/General.module.css';
import { useState } from 'react';
import { registerUser, loginUser } from '../services/authService';

// Merge both style objects - registerStyles will override generalStyles if there are conflicts
const styles = { ...generalStyles, ...registerStyles };

function Register() {
    // Registration component code here
    const [message,setMessage] = useState(''); //this is a setter, message is the variable and setMessage is the function to set it
    const [email,setEmail] = useState('');
    const [password,setPassword] = useState('');
    const [confirmPassword,setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [id,setId] = useState('');
    const [role, setRole] = useState('student');

    async function doRegister(event:any) : Promise<void>
    {
        event.preventDefault();

        // Validate passwords match
        if (password !== confirmPassword) {
            setMessage('Passwords do not match');
            return;
        }

        try {
            // Register the user
            await registerUser(email, password, firstName, lastName, id, role);
            
            // Automatically log them in after successful registration
            await loginUser(email, password);
            
            setMessage('Registration successful!');
            window.location.href = '/cards';
        }
        catch (error: any) {
            setMessage(error.message || 'Registration failed');
        }
    }

    return (
    <div id="registerWrapper" className={styles.cardWrapper}>
            <div id="loginDiv">
                <span id="inner-title" className={styles.cardTitle}>PLEASE REGISTER</span><br />
                <div id="emailInput" className={styles.inputRow}>
                    <label className={styles.inputLabel} htmlFor="registerName">Email:</label>
                    <input type="text" id="registerName" placeholder="johnDoe@example.com" className={styles.textInput} onChange={handleSetEmail} />
                </div>
                <div id="idInput" className={styles.inputRow}>
                    <label className={styles.inputLabel} htmlFor="registerId">ID:</label>
                    <input type="text" id="registerId" placeholder="ID" className={styles.textInput} onChange={handleSetId} />
                </div>
                <div id="firstNameInput" className={styles.inputRow}>
                    <label className={styles.inputLabel} htmlFor="registerFirstName">First Name:</label>
                    <input type="text" id="registerFirstName" placeholder="First Name" className={styles.textInput} onChange={handleSetFirstName} />
                </div>
                <div id="lastNameInput" className={styles.inputRow}>
                    <label className={styles.inputLabel} htmlFor="registerLastName">Last Name:</label>
                    <input type="text" id="registerLastName" placeholder="Last Name" className={styles.textInput} onChange={handleSetLastName} />
                </div>
                <div id="passwordInput" className={styles.inputRow}>
                    <label className={styles.inputLabel} htmlFor="registerPassword">Password:</label>
                    <input type="password" id="registerPassword" placeholder="Password" className={styles.textInput} onChange={handleSetPassword} />
                </div>
                <div id="passwordInput" className={styles.inputRow}>
                    <label className={styles.inputLabel} htmlFor="registerConfirmPassword">Confirm Password:</label>
                    <input type="password" id="registerConfirmPassword" placeholder="Confirm Password" className={styles.textInput} onChange={handleSetConfirmPassword} />
                </div>
                <div id="roleButton" className={styles.inputRow}>
                    <label className={styles.inputLabel}>Are you an instructor?</label>
                    <button 
                        type="button"
                        className={`${styles.toggleButton} ${role === 'teacher' ? styles.toggleActive : ''}`}
                        onClick={() => setRole(role === 'teacher' ? 'student' : 'teacher')}
                    >
                        {role === 'teacher' ? 'Yes - Instructor' : 'No - Student'}
                    </button>
                </div>
                
                <input type="submit" id="registerButton" className={styles.buttons} value = "Register"
                onClick={doRegister} />
                <div id="registerResult">{message}</div>
                <br />
                <br />
                <div id="registerText" >
                    Already have an account? <a className={styles.buttons} href="/">Log in</a>
                </div>
            </div>
        </div>
    );

    function handleSetEmail( e: any ) : void
        {
            setEmail( e.target.value );
        }
    function handleSetPassword( e: any ) : void
        {
            setPassword( e.target.value );
        }
    function handleSetFirstName( e: any ) : void
        {
            setFirstName( e.target.value );
        }
    function handleSetLastName( e: any ) : void
        {
            setLastName( e.target.value );
        }
    function handleSetId( e: any ) : void
        {
            setId( e.target.value );
        }
    function handleSetConfirmPassword( e: any ) : void
        {
            setConfirmPassword( e.target.value );
        }
}
export default Register;