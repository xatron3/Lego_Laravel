import DashboardLayout from "../../components/DashboardLayout";
import SalesAnalytics from "../../components/SalesAnalytics";

export default function Sales() {
    return (
        <DashboardLayout currentPage="sales">
            <SalesAnalytics />
        </DashboardLayout>
    );
}
