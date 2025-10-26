import {redirect} from "next/navigation";
import FootageAnalytics from "@/app/(dashboard)/footages/_components/footage-analytics";
import {Id} from "../../../../../convex/_generated/dataModel";

type FootageProps = {
    params: Promise<{
        id: string
    }>
}

export default async function FootageID({ params }: FootageProps) {

    const { id } = (await params);

    if (!id) {
        redirect("/footages");
    }

    return <FootageAnalytics footageID={id as Id<"footages">} />
}