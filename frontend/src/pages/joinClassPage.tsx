import PageHeader from "../components/PageHeader";
import JoinClass from "../components/JoinClass";      
import ClassDetailsHeader from "../components/ClassDetailsHeader";
const JoinClassPage = () =>
{
    return(
        <div>
            <PageHeader />
            <ClassDetailsHeader />
            <JoinClass />
        </div>
    );
};
export default JoinClassPage;