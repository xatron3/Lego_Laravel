import { router } from "@inertiajs/react";
import DashboardLayout from "../../components/DashboardLayout";
import MocSubmitWizard from "../../components/moc/MocSubmitWizard";

export default function Submit() {
    const handleMocSubmitSuccess = () => {
        router.visit("/dashboard/my-models");
    };

    const handleCancel = () => {
        router.visit("/dashboard/my-models");
    };

    return (
        <DashboardLayout currentPage="submit">
            <MocSubmitWizard
                onSuccess={handleMocSubmitSuccess}
                onCancel={handleCancel}
            />
        </DashboardLayout>
    );
}
