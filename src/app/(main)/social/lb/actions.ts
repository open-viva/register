"use server";
import { handleAuthError } from "@/lib/api";
import { db } from "@/lib/db";
import { hasPermission, PERMISSIONS } from "@/lib/perms";
import { getUserDetailsFromToken } from "@/lib/utils";
import { cookies } from "next/headers";

export async function getLeaderboard() {
    const cookieStore = await cookies();
    const userData = await getUserDetailsFromToken(cookieStore.get("internal_token")?.value || "");
    if (!userData) {
        return handleAuthError();
    }
    const userId = userData.uid;
    const currentUser = await db.user.findFirst({
        where: {
            internalId: userData.internalId
        }
    });
    if (!currentUser) {
        return handleAuthError();
    }
    if (!hasPermission(currentUser.permissions, PERMISSIONS.VERIFIED)) {
        return;
    }
    if (!currentUser.hasAcceptedSocialTerms) {
        return;
    }
    const leaderboard = await db.user.findMany({
        select: {
            name: true,
            average: true,
            delays: true,
            absencesHours: true,
            hasAcceptedSocialTerms: true,
            lastServerDataUpdate: true,
            id: true,
            permissions: true,
            internalId: true,
            followers: true
        }
    }).then(users => users.filter(user => user.average !== null && user.hasAcceptedSocialTerms && user.name !== null));
    return leaderboard.map(user => ({
        isRequestingUser: user.id === userId,
        name: user.name,
        average: user.average,
        delaysNumber: user.delays,
        absenceHours: user.absencesHours,
        permissions: user.permissions,
        internalId: user.internalId,
        followers: user.followers.length,
        lastServerDataUpdate: user.lastServerDataUpdate 
    }));
}