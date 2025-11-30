"use server";

import { verifySession } from "@/app/(auth)/auth/actions";
import { handleAuthError } from "@/lib/api";
import { db } from "@/lib/db";
import { getUserDetailsFromToken } from "@/lib/utils";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import path from 'path';
import sharp from 'sharp';
import { getLeaderboard } from "../social/lb/actions";
import { LeaderboardEntryType } from "../social/lb/page";

export async function getUserData(userId?: string) {
    const cookieStore = await cookies();
    const userData = await getUserDetailsFromToken(cookieStore.get("internal_token")?.value || "");
    if (!userData) {
        return handleAuthError();
    }
    if (userId == userData.internalId) {
        redirect("/profile");
    }
    if (!(await verifySession())) {
        return handleAuthError();
    }

    const [user, postCountResult] = await Promise.all([
        db.user.findUnique({
            where: { internalId: userId || userData.internalId },
            select: {
                internalId: true,
                lastServerDataUpdate: true,
                name: true,
                school: true,
                average: true,
                absencesHours: true,
                delays: true,
                permissions: true,
                bio: true,
                followers: true,
                hasAcceptedSocialTerms: true,
            }
        }),
        db.post.findMany({
            where: {
                authorId: userId || userData.internalId,
            },
            select: {
                likes: true,
            }
        })
    ]);
    if (!user?.hasAcceptedSocialTerms) {
        return null;
    }

    const leaderboard: LeaderboardEntryType[] = await getLeaderboard() as LeaderboardEntryType[];
    if (!leaderboard) {
        return null;
    }
    const averageLeaderboard = leaderboard.sort((a, b) => {
        if (b.average === a.average) {
            return new Date(b.lastServerDataUpdate).getTime() - new Date(a.lastServerDataUpdate).getTime();
        }
        return b.average - a.average;
    });
    const averageRank = averageLeaderboard.findIndex(entry => entry.internalId === (userId || userData.internalId));

    const absencesLeaderboard = leaderboard.sort((a, b) => {
        if (b.absenceHours === a.absenceHours) {
            return new Date(b.lastServerDataUpdate).getTime() - new Date(a.lastServerDataUpdate).getTime();
        }
        return b.absenceHours - a.absenceHours;
    });
    const absencesRank = absencesLeaderboard.findIndex(entry => entry.internalId === (userId || userData.internalId));

    const delaysLeaderboard = leaderboard.sort((a, b) => {
        if (b.delaysNumber === a.delaysNumber) {
            return new Date(b.lastServerDataUpdate).getTime() - new Date(a.lastServerDataUpdate).getTime();
        }
        return b.delaysNumber - a.delaysNumber;
    });
    const delaysRank = delaysLeaderboard.findIndex(entry => entry.internalId === (userId || userData.internalId));

    const followersLeaderboard = leaderboard.sort((a, b) => {
        if (b.followers === a.followers) {
            return new Date(b.lastServerDataUpdate).getTime() - new Date(a.lastServerDataUpdate).getTime();
        }
        return b.followers - a.followers;
    });
    const followersRank = followersLeaderboard.findIndex(entry => entry.internalId === (userId || userData.internalId));

    const isFollowed = user?.followers?.some(follow => follow.followedId === (userId || userData.internalId)) || false;
    const likeCount = postCountResult.reduce((acc, post) => acc + post.likes.length, 0);
    const userRanking = {
        averageRank: averageRank + 1,
        absencesRank: absencesRank + 1,
        delaysRank: delaysRank + 1,
        followersRank: followersRank + 1,
        followCount: user?.followers?.length || 0,
        isFollowed: isFollowed,
    };
    return { ...user, likeCount, ...userRanking };
}

export async function followUser(userId: string) {
    const cookieStore = await cookies();
    const userData = await getUserDetailsFromToken(cookieStore.get("internal_token")?.value || "");
    if (!userData) {
        return handleAuthError();
    }
    if (!(await verifySession())) {
        return handleAuthError();
    }

    await db.followUserInteraction.upsert({
        where: {
            id: `${userData.internalId}_${userId}`,
        },
        create: {
            followerId: userData.internalId,
            followedId: userId,
        },
        update: {},
    })
}

export async function unfollowUser(userId: string) {
    const cookieStore = await cookies();
    const userData = await getUserDetailsFromToken(cookieStore.get("internal_token")?.value || "");
    if (!userData) {
        return handleAuthError();
    }
    if (!(await verifySession())) {
        return handleAuthError();
    }

    await db.followUserInteraction.deleteMany({
        where: {
            followerId: userData.internalId,
            followedId: userId,
        },
    });
}

export async function updateBio(bio: string) {
    const cookieStore = await cookies();
    const userData = await getUserDetailsFromToken(cookieStore.get("internal_token")?.value || "");
    if (!userData) {
        return handleAuthError();
    }
    if (!(await verifySession())) {
        return handleAuthError();
    }
    await db.user.update({
        where: { internalId: userData.internalId },
        data: {
            bio: bio.substring(0, 200),
        }
    });
    return { success: true };
}

export async function updateAvatar(base64Image: string) {
    const cookieStore = await cookies();
    const userData = await getUserDetailsFromToken(cookieStore.get("internal_token")?.value || "");
    if (!userData) {
        return handleAuthError();
    }

    if (!(await verifySession())) {
        return handleAuthError();
    }

    if (!base64Image) {
        return { success: false };
    }

    const base64Data = base64Image.split(',')[1];
    const avatarPath = path.join(process.cwd(), 'public', 'userassets', 'avatars', `${userData.internalId}.jpg`);
    const avatarBuffer = Buffer.from(base64Data, 'base64');

    try {
        await sharp(avatarBuffer)
            .resize(200, 200)
            .jpeg({ mozjpeg: true })
            .toFile(avatarPath);
        return { success: true };
    } catch (error) {
        console.error('Error processing avatar:', error);
    }
}

export async function updateBanner(base64Image: string) {
    const cookieStore = await cookies();
    const userData = await getUserDetailsFromToken(cookieStore.get("internal_token")?.value || "");
    if (!userData) {
        return handleAuthError();
    }

    if (!(await verifySession())) {
        return handleAuthError();
    }

    if (!base64Image) {
        return { success: false };
    }

    const base64Data = base64Image.split(',')[1];
    const bannerPath = path.join(process.cwd(), 'public', 'userassets', 'banners', `${userData.internalId}.jpg`);
    const bannerBuffer = Buffer.from(base64Data, 'base64');

    try {
        await sharp(bannerBuffer)
            .jpeg({ mozjpeg: true })
            .toFile(bannerPath);

        return { success: true };
    } catch (error) {
        console.error('Error processing banner:', error);
    }
}