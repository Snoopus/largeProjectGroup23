import PageHeader from "../components/PageHeader";
import ClassDetails from "../components/ClassDetails";
import ClassDetailsHeader from "../components/ClassDetailsHeader";
const ClassDetailsPage = () =>
{
    return(
        <div>
            <PageHeader />
            <ClassDetailsHeader />
            <ClassDetails />
        </div>
    );
};
export default ClassDetailsPage;