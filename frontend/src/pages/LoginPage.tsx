import PageTitle from '../components/PageTitle.tsx';
import Login from '../components/Login.tsx';
import PageHeader from '../components/PageHeader.tsx';
const LoginPage = () =>
{
    return(
        <div>
            <PageHeader />
            <PageTitle />
            <Login />
        </div>
    );
};
export default LoginPage;