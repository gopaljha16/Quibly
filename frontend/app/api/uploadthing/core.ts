import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
    // Define as many FileRoutes as you like, each with a unique routeSlug
    messageFile: f({
        image: { maxFileSize: "4MB", maxFileCount: 1 },
        video: { maxFileSize: "16MB", maxFileCount: 1 }
    })
        .middleware(async () => {
            // In a real app, check auth here
            // const user = await auth();
            // if (!user) throw new Error("Unauthorized");
            return {};
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Upload complete:", file.url);
            return { url: file.url };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
