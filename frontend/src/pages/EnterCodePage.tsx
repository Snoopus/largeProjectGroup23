import PageHeader from "../components/PageHeader";
import EnterCode from "../components/EnterCode";
import { useSearchParams } from 'react-router-dom';

const EnterCodePage = () => {
    const [searchParams] = useSearchParams();
    const type = searchParams.get('type');
    
    // Determine mode from URL parameter
    // /verification?type=reset or /verification?type=registration
    const mode = type === 'reset' ? 'passwordReset' : 'registration';

    return (
        <div>
            <PageHeader />
            <EnterCode mode={mode} />
        </div>
    );
};

export default EnterCodePage;