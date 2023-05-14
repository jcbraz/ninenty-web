import { z } from "zod";
import moment from 'moment';

import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";


export const schedulesRouter = createTRPCRouter({
    calculateScheudulesSleepHours: publicProcedure
        .input(z.object({
            fallAsleepTime: z.string(),
            hoursToSleep: z.number(),
            fallAsleepMargin: z.number().optional(),
            // eslint-disable-next-line @typescript-eslint/require-await
        })).query(async ({ input }) => {
            const { fallAsleepTime, hoursToSleep, fallAsleepMargin } = input;

            const fallAsleepMoment = input.fallAsleepMargin ? moment(fallAsleepTime).add(fallAsleepMargin, 'minutes') : moment(fallAsleepTime);

            const momentsArray: moment.Moment[] = [];
            let fallAsleepMomentClone = fallAsleepMoment.clone().add(90, 'minutes');
            for (let i = 0; i < hoursToSleep; ++i) {
                momentsArray.push(fallAsleepMomentClone);
                fallAsleepMomentClone = fallAsleepMomentClone.clone().add(90, 'minutes');
            }

            const targetMoment = fallAsleepMoment.clone().add(hoursToSleep, 'hours');
            let closestEarlierMoment: moment.Moment | undefined;
            let closestLaterMoment: moment.Moment | undefined;

            momentsArray.forEach(momentInArray => {
                if (momentInArray.isBefore(targetMoment)) {
                    if (!closestEarlierMoment || momentInArray.isAfter(closestEarlierMoment)) {
                        closestEarlierMoment = momentInArray;
                    }
                } else {
                    if (!closestLaterMoment || momentInArray.isBefore(closestLaterMoment)) {
                        closestLaterMoment = momentInArray;
                    }
                }
            });

            return {
                closestEarlierMoment,
                closestLaterMoment
            };
        }),
    getUserSchedules: protectedProcedure
        .input(z.object({
            userId: z.string(),
        }))
        .query(async ({ input, ctx }) => {
            const { userId } = input;
            const schedules = await ctx.prisma.schedule.findMany({
                where: {
                    userId
                }
            });
            return {
                schedules
            };
        }),
    addUserSchedule: protectedProcedure
        .input(z.object({
            userId: z.string(),
            time: z.string(),
            title: z.string().optional(),
            description: z.string().optional()
        }))
        .mutation(async ({ input, ctx }) => {
            const { userId, time, title, description } = input;
            const schedule = await ctx.prisma.schedule.create({
                data: {
                    userId,
                    time,
                    title,
                    description
                }
            });
            return {
                schedule
            };
        }),
});


export type SchedulesRouter = typeof schedulesRouter;
