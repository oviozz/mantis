import type {Metadata} from "next";
import "./globals.css";
import {cn} from "@/lib/utils";
import {outfit} from "@/styles/fonts";
import {ConvexClientProvider} from "@/components/convex-client-provider";
import UploadDialog from "@/components/upload-footage";

export const metadata: Metadata = {
    title: "Calhacks12.0",
    description: "project made 10/24/2024",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={cn("antialiased", outfit.className)}>
                <ConvexClientProvider>
                    {children}
                    <UploadDialog />
                </ConvexClientProvider>
            </body>
        </html>
    );
}
