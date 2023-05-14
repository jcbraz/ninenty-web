import { Prisma } from "@prisma/client";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";


const defaultUserSelect = Prisma.validator<Prisma.UserSelect>()({
    id: true,
    firstName: true,
    lastName: true,
});

export const usersRouter = createTRPCRouter({

    list: protectedProcedure
        .input(
            z.object({
                limit: z.number().min(1).max(100).nullish(),
                cursor: z.string().nullish(),
            }),
        )
        .query(async ({ input, ctx }) => {
            const limit = input.limit ?? 50;
            const { cursor } = input;

            const items = await ctx.prisma.user.findMany({
                select: defaultUserSelect,
                take: limit + 1,
                where: {},
                cursor: cursor
                    ? {
                        id: cursor,
                    }
                    : undefined,
                orderBy: {
                    id: 'asc',
                },
            });

            let nextCursor: typeof cursor | undefined = undefined;
            if (items.length > limit) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const nextItem = items.pop()!;
                nextCursor = nextItem.id;
            }

            return {
                items: items.reverse(),
                nextCursor,
            };
        }),
    createUser: protectedProcedure.mutation(async ({ ctx }) => {

        if (!ctx.user) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'Not authorized',
            });
        }

        if (await ctx.prisma.user.findUnique({ where: { id: ctx.user.id } }))
            throw new TRPCError({
                code: 'CONFLICT',
                message: 'User already exists',
            });

        const data = {
            id: ctx.user.id,
            firstName: ctx.user.firstName,
            lastName: ctx.user.lastName,
        }

        const user = await ctx.prisma.user.create({
            data: data,
            select: defaultUserSelect,
        });

        return user;

    }),
    getUserInfo: protectedProcedure.query(({ ctx }) => {
        const data = {
            id: ctx.user?.id,
            firstName: ctx.user?.firstName,
            lastName: ctx.user?.lastName,
        }
        return data;
    }),
    getAll: protectedProcedure.query(({ ctx }) => {
        return ctx.prisma.user.findMany();
    }),
    hello: protectedProcedure.query(({ ctx }) => {
        return ctx.user?.id;
    }),
});

export type UsersRouter = typeof usersRouter;