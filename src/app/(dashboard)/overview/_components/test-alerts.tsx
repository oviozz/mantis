"use client";
import {useMutation} from "convex/react";
import {api} from "../../../../../convex/_generated/api";
import {Button} from "@/components/ui/button";

const TEST_SCENARIOS = [
    {
        type: "theft" as const,
        summaries: [
            "Customer concealing items in bag at checkout",
            "Suspicious individual pocketing merchandise in electronics section",
            "Multiple items hidden under clothing detected",
            "Customer left store without paying for cart items",
        ],
        imageUrls: [
            "https://picsum.photos/seed/theft1/400/300",
            "https://picsum.photos/seed/theft2/400/300",
        ],
    },
    {
        type: "weapon" as const,
        summaries: [
            "Potential weapon detected on customer entering store",
            "Sharp object visible in customer's possession",
            "Security alert: weapon-like object spotted in parking lot",
            "Metal detector triggered at entrance",
        ],
        imageUrls: [
            "https://picsum.photos/seed/weapon1/400/300",
            "https://picsum.photos/seed/weapon2/400/300",
        ],
    },
    {
        type: "repeat" as const,
        summaries: [
            "Known shoplifter detected entering premises",
            "Previously banned individual identified on camera",
            "Repeat offender spotted in store again",
            "Face match with incident database - repeat visitor",
        ],
        imageUrls: [
            "https://picsum.photos/seed/repeat1/400/300",
            "https://picsum.photos/seed/repeat2/400/300",
        ],
    },
    {
        type: "other" as const,
        summaries: [
            "Unusual behavior detected in storage area",
            "Customer loitering near restricted zone",
            "Unattended bag in public area",
            "Suspicious activity reported by staff",
            "Emergency exit door left open",
        ],
        imageUrls: [
            "https://picsum.photos/seed/other1/400/300",
            "https://picsum.photos/seed/other2/400/300",
        ],
    },
];

export default function TestAlerts() {
    const createAlert = useMutation(api.alerts.create);

    const getRandomItem = <T, >(array: T[]): T => {
        return array[Math.floor(Math.random() * array.length)];
    };

    const createRandomAlert = async () => {
        const scenario = getRandomItem(TEST_SCENARIOS);
        const summary = getRandomItem(scenario.summaries);
        const imageUrl = getRandomItem(scenario.imageUrls);

        await createAlert({
            type: scenario.type,
            summary,
            faceID: null,
            imageUrl,
        });
    };

    return (
        <Button
            onClick={createRandomAlert}
            className="rounded-none px-4 py-2 bg-blue-600 text-white hover:bg-blue-700"
        >
            Create Random Alert
        </Button>
    );
}