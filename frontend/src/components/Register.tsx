import registerStyles from '../css/Register.module.css';
import generalStyles from '../css/General.module.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../services/authService';
import { buildPath } from '../services/buildPath';
import { validateEmail, validatePassword, validateConfirmPassword, validateName, validateUserId } from '../utils/validation';

// Merge both style objects - registerStyles will override generalStyles if there are conflicts
const styles = { ...generalStyles, ...registerStyles };
const STUDENT = 'student';
const TEACHER = 'teacher';

function Register() {
    // Registration component code here
    const [message,setMessage] = useState(''); //this is a setter, message is the variable and setMessage is the function to set it
    const [email,setEmail] = useState('');
    const [password,setPassword] = useState('');
    const [confirmPassword,setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [id,setId] = useState('');
    const [role, setRole] = useState(STUDENT);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    // Validation state
    const [errors, setErrors] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        id: ''
    });
    const [touched, setTouched] = useState({
        email: false,
        password: false,
        confirmPassword: false,
        firstName: false,
        lastName: false,
        id: false
    });

    // Validation functions
    const validateEmailField = () => {
        const result = validateEmail(email);
        setErrors(prev => ({ ...prev, email: result.error }));
        return result.isValid;
    };

    const validatePasswordField = () => {
        const result = validatePassword(password);
        setErrors(prev => ({ ...prev, password: result.error }));
        return result.isValid;
    };

    const validateConfirmPasswordField = () => {
        const result = validateConfirmPassword(password, confirmPassword);
        setErrors(prev => ({ ...prev, confirmPassword: result.error }));
        return result.isValid;
    };

    const validateFirstNameField = () => {
        const result = validateName(firstName, 'First name');
        setErrors(prev => ({ ...prev, firstName: result.error }));
        return result.isValid;
    };

    const validateLastNameField = () => {
        const result = validateName(lastName, 'Last name');
        setErrors(prev => ({ ...prev, lastName: result.error }));
        return result.isValid;
    };

    const validateIdField = () => {
        const result = validateUserId(id);
        setErrors(prev => ({ ...prev, id: result.error }));
        return result.isValid;
    };

    const handleBlur = (field: keyof typeof touched) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        
        // Validate the field that was just blurred
        switch(field) {
            case 'email': validateEmailField(); break;
            case 'password': validatePasswordField(); break;
            case 'confirmPassword': validateConfirmPasswordField(); break;
            case 'firstName': validateFirstNameField(); break;
            case 'lastName': validateLastNameField(); break;
            case 'id': validateIdField(); break;
        }
    };

    async function doRegister(event: React.FormEvent) : Promise<void>
    {
        event.preventDefault();

        // Mark all fields as touched
        setTouched({
            email: true,
            password: true,
            confirmPassword: true,
            firstName: true,
            lastName: true,
            id: true
        });

        // Validate all fields
        const isEmailValid = validateEmailField();
        const isPasswordValid = validatePasswordField();
        const isConfirmPasswordValid = validateConfirmPasswordField();
        const isFirstNameValid = validateFirstNameField();
        const isLastNameValid = validateLastNameField();
        const isIdValid = validateIdField();

        if (!isEmailValid || !isPasswordValid || !isConfirmPasswordValid || 
            !isFirstNameValid || !isLastNameValid || !isIdValid) {
            setMessage('Please fix all errors before submitting');
            return;
        }

        setIsLoading(true);

        try {
            
            const registrationInfo = { 
                email: email,
                password: password,
                firstName: firstName, 
                lastName: lastName, 
                id: id,
                role: role || "student"
            };


            try {
                const obj = { 
                    email: email,
                    userId: id
                };
                const js = JSON.stringify(obj);
                const url = buildPath('api/findExistingUser');
                

                const response = await fetch(url, {
                    method: 'POST',
                    body: js,
                    headers: { 'Content-Type': 'application/json' }
                });
            
                const res = JSON.parse(await response.text());
                console.log('Find Existing User Response:', res); // Debug
                if (res.error === '') {
                    throw new Error("User already exists with this email or ID");
                }
                else{
                    setMessage('Registration successful!');
                    // Navigate to verification page with email
                    navigate('/verification?type=registration', { 
                        state: { email: email } 
                    });
                }
                
                
            }
            catch (error: any) {
                setMessage(error.message || 'Registration failed');
            }

            localStorage.setItem('registration_data', JSON.stringify(registrationInfo));
            
            

            
        }
        catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Registration failed';
            setMessage(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }

    return (
    <div id="registerWrapper" className={styles.cardWrapper}>
            <div id="loginDiv">
                <span id="inner-title" className={styles.cardTitle}>PLEASE REGISTER</span><br />
                <div id="emailInput" className={styles.inputRow}>
                    <label className={styles.inputLabel} htmlFor="registerName">Email:</label>
                    <input 
                        type="email" 
                        id="registerName" 
                        placeholder="johnDoe@example.com" 
                        className={`${styles.textInput} ${touched.email && errors.email ? styles.inputError : ''}`}
                        onChange={handleSetEmail}
                        onBlur={() => handleBlur('email')}
                        required 
                    />
                    {touched.email && errors.email && (
                        <span className={styles.errorMessage}>{errors.email}</span>
                    )}
                </div>
                <div id="idInput" className={styles.inputRow}>
                    <label className={styles.inputLabel} htmlFor="registerId">ID:</label>
                    <input 
                        type="text" 
                        id="registerId" 
                        placeholder="AB123456" 
                        className={`${styles.textInput} ${touched.id && errors.id ? styles.inputError : ''}`}
                        onChange={handleSetId}
                        onBlur={() => handleBlur('id')}
                    />
                    {touched.id && errors.id && (
                        <span className={styles.errorMessage}>{errors.id}</span>
                    )}
                </div>
                <div id="firstNameInput" className={styles.inputRow}>
                    <label className={styles.inputLabel} htmlFor="registerFirstName">First Name:</label>
                    <input 
                        type="text" 
                        id="registerFirstName" 
                        placeholder="First Name" 
                        className={`${styles.textInput} ${touched.firstName && errors.firstName ? styles.inputError : ''}`}
                        onChange={handleSetFirstName}
                        onBlur={() => handleBlur('firstName')}
                    />
                    {touched.firstName && errors.firstName && (
                        <span className={styles.errorMessage}>{errors.firstName}</span>
                    )}
                </div>
                <div id="lastNameInput" className={styles.inputRow}>
                    <label className={styles.inputLabel} htmlFor="registerLastName">Last Name:</label>
                    <input 
                        type="text" 
                        id="registerLastName" 
                        placeholder="Last Name" 
                        className={`${styles.textInput} ${touched.lastName && errors.lastName ? styles.inputError : ''}`}
                        onChange={handleSetLastName}
                        onBlur={() => handleBlur('lastName')}
                    />
                    {touched.lastName && errors.lastName && (
                        <span className={styles.errorMessage}>{errors.lastName}</span>
                    )}
                </div>
                <div id="passwordInput" className={styles.inputRow}>
                    <label className={styles.inputLabel} htmlFor="registerPassword">Password:</label>
                    <input 
                        type="password" 
                        id="registerPassword" 
                        placeholder="Password" 
                        className={`${styles.textInput} ${touched.password && errors.password ? styles.inputError : ''}`}
                        onChange={handleSetPassword}
                        onBlur={() => handleBlur('password')}
                    />
                    {touched.password && errors.password && (
                        <span className={styles.errorMessage}>{errors.password}</span>
                    )}
                </div>
                <div id="confirmPasswordInput" className={styles.inputRow}>
                    <label className={styles.inputLabel} htmlFor="registerConfirmPassword">Confirm Password:</label>
                    <input 
                        type="password" 
                        id="registerConfirmPassword" 
                        placeholder="Confirm Password" 
                        className={`${styles.textInput} ${touched.confirmPassword && errors.confirmPassword ? styles.inputError : ''}`}
                        onChange={handleSetConfirmPassword}
                        onBlur={() => handleBlur('confirmPassword')}
                    />
                    {touched.confirmPassword && errors.confirmPassword && (
                        <span className={styles.errorMessage}>{errors.confirmPassword}</span>
                    )}
                </div>
                <div id="roleButton" className={styles.inputRow}>
                    <label className={styles.inputLabel}>Are you an instructor?</label>
                    <button 
                        type="button"
                        className={`${styles.toggleButton} ${role === TEACHER ? styles.toggleActive : ''}`}
                        onClick={() => setRole(role === TEACHER ? STUDENT : TEACHER)}
                    >
                        {role === TEACHER ? 'Yes - Instructor' : 'No - Student'}
                    </button>
                </div>
                
                <input 
                    type="submit" 
                    id="registerButton" 
                    className={styles.buttons} 
                    value={isLoading ? "Registering..." : "Register"}
                    onClick={doRegister}
                    disabled={isLoading}
                />
                {message && (
                    <div id="registerResult" className={`${styles.resultMessage} ${styles.error}`}>
                        {message}
                    </div>
                )}
                <br />
                <br />
                <div id="registerText" >
                    Already have an account? <a href="/">Log in</a>
                </div>
            </div>
        </div>
    );

    function handleSetEmail( e: React.ChangeEvent<HTMLInputElement> ) : void
        {
            setEmail( e.target.value );
            if (touched.email) validateEmailField();
        }
    function handleSetPassword( e: React.ChangeEvent<HTMLInputElement> ) : void
        {
            setPassword( e.target.value );
            if (touched.password) {
                validatePasswordField();
                // Also revalidate confirm password if it's been touched
                if (touched.confirmPassword) validateConfirmPasswordField();
            }
        }
    function handleSetFirstName( e: React.ChangeEvent<HTMLInputElement> ) : void
        {
            setFirstName( e.target.value );
            if (touched.firstName) validateFirstNameField();
        }
    function handleSetLastName( e: React.ChangeEvent<HTMLInputElement> ) : void
        {
            setLastName( e.target.value );
            if (touched.lastName) validateLastNameField();
        }
    function handleSetId( e: React.ChangeEvent<HTMLInputElement> ) : void
        {
            setId( e.target.value );
            if (touched.id) validateIdField();
        }
    function handleSetConfirmPassword( e: React.ChangeEvent<HTMLInputElement> ) : void
        {
            setConfirmPassword( e.target.value );
            if (touched.confirmPassword) validateConfirmPasswordField();
        }
}
export default Register;