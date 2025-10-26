import LiveAlerts from "@/app/(dashboard)/overview/_components/live-alerts";
import CameraModel from "@/app/(dashboard)/overview/_components/camera-model";

export default function VideoIntelligenceDashboard() {

    return (
        <div className="min-h-screen text-gray-900 p-5 grid grid-cols-3 gap-4">
            {/* Live Feed Section */}
            <div className="col-span-2 flex flex-col border border-gray-200 bg-white px-6 py-4">

                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Live Feed</h2>
                </div>
                <p className="text-sm text-gray-600">
                    Real-time camera footage
                </p>

                <CameraModel />

            </div>

            {/* Live Alerts Section */}
            <div className="col-span-1 flex flex-col border border-gray-200 bg-white px-4 pt-4">
                <LiveAlerts />
            </div>
        </div>
    );
}