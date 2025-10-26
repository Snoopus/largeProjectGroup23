import PageHeader from "../components/PageHeader";
import AddClass from "../components/AddClass";      
import ClassDetailsHeader from "../components/ClassDetailsHeader";
const AddClassPage = () =>
{
    return(
        <div>
            <PageHeader />
            <ClassDetailsHeader />
            <AddClass />
        </div>
    );
};
export default AddClassPage;