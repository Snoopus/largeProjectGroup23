// Shared authentication functions
import { buildPath } from "./buildPath";

export async function loginUser(loginName: string, password: string) {
    const obj = { login: loginName, password: password };
    const js = JSON.stringify(obj);
    const url = buildPath('api/login');
    console.log('Login URL:', url); // Debug

    const response = await fetch(url, {
        method: 'POST',
        body: js,
        headers: { 'Content-Type': 'application/json' }
    });

    const res = JSON.parse(await response.text());

    if (res.id <= 0) {
        throw new Error('User/Password combination incorrect');
    }

    // Handle both firstName and first_name from API
    const user = { 
        firstName: res.firstName || res.first_name, 
        lastName: res.lastName || res.last_name, 
        id: res.id,
        role: res.role || "student"
    };
    localStorage.setItem('user_data', JSON.stringify(user));
    console.log('Raw localStorage data:', user); // Debug

    return user;
}

export async function registerUser(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    id: string,
    role: string
) {
    const obj = { email, password, firstName, lastName, id, role };
    const js = JSON.stringify(obj);
    const url = buildPath('api/register');
    console.log('Register URL:', url); // Debug

    const response = await fetch(url, {
        method: 'POST',
        body: js,
        headers: { 'Content-Type': 'application/json' }
    });

    const res = JSON.parse(await response.text());

    console.log(res); 

    if (res.error != '') {
        throw new Error(res.error || 'Registration failed');
    }

    return res;
}
