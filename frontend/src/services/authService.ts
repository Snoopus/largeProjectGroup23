// Shared authentication functions

export async function loginUser(loginName: string, password: string) {
    const obj = { login: loginName, password: password };
    const js = JSON.stringify(obj);

    const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        body: js,
        headers: { 'Content-Type': 'application/json' }
    });

    const res = JSON.parse(await response.text());

    if (res.id <= 0) {
        throw new Error('User/Password combination incorrect');
    }

    const user = { firstName: res.firstName, lastName: res.lastName, id: res.id };
    localStorage.setItem('user_data', JSON.stringify(user));

    return user;
}

export async function registerUser(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    id: string
) {
    const obj = { email, password, firstName, lastName, id };
    const js = JSON.stringify(obj);

    const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        body: js,
        headers: { 'Content-Type': 'application/json' }
    });

    const res = JSON.parse(await response.text());

    if (!res.success) {
        throw new Error(res.message || 'Registration failed');
    }

    return res;
}
