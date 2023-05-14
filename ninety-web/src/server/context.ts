import { getAuth, clerkClient } from "@clerk/nextjs/server";
import type { User } from '@clerk/nextjs/api';
import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import { type inferAsyncReturnType } from "@trpc/server";


interface UserProps {
    user: User | null;
}

// eslint-disable-next-line @typescript-eslint/require-await
export const createContextInner = async ({ user }: UserProps) => {
    return user ? { user } : {};
}


export const createContext = async (_opts: CreateNextContextOptions) => {
    async function getUser() {
        const { userId } = getAuth(_opts.req);
        const user = userId ? clerkClient.users.getUser(userId) : null;
        return user;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const user = await getUser();
    return await createContextInner({ user });
};

export type Context = inferAsyncReturnType<typeof createContext>;