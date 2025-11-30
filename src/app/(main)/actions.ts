"use server";
import { handleAuthError } from "@/lib/api";
import { AgendaItemType, GradeType, Notification } from "@/lib/types";
import { cookies } from "next/headers";
import { getUserDetails, verifySession } from "../(auth)/auth/actions";
import { db } from "@/lib/db";
import { getMarks, getPresence } from "./register/actions";
import { getUserDetailsFromToken } from "@/lib/utils";

export async function getDayAgenda(date: Date) {
    const cookieStore = await cookies();
    const userData = await getUserDetailsFromToken(cookieStore.get("internal_token")?.value || "");
    if (!userData) {
        return handleAuthError();
    }
    const formData = new FormData();
    formData.append("start", Math.floor(new Date(date.setHours(0, 0, 0, 0)).getTime() / 1000).toString());
    formData.append("end", Math.floor(new Date(date.setDate(date.getDate() + 1)).setHours(0, 0, 0, 0) / 1000).toString());
    const res = await fetch(`https://web.spaggiari.eu/fml/app/default/agenda_studenti.php?ope=get_events`, {
        method: "POST",
        headers: {
            "Cookie": `PHPSESSID=${cookieStore.get("token")?.value}; webidentity=${userData.uid};`,
        },
        body: formData
    })
    let data;
    try {
        data = (await res.json()).filter((item: AgendaItemType) => item.tipo === "nota");
    } catch {
        return handleAuthError();
    }
    return data;
}

export async function getDayLessons(date: Date) {
    const cookieStore = await cookies();
    const userData = await getUserDetailsFromToken(cookieStore.get("internal_token")?.value || "");
    if (!userData) {
        return handleAuthError();
    }
    const formattedDate = date.toISOString().split('T')[0];
    const res = await fetch(`https://web.spaggiari.eu/fml/app/default/attivita_studente.php?a=get_lezioni&data=${formattedDate}`, {
        headers: {
            "Cookie": `PHPSESSID=${cookieStore.get("token")?.value}; webidentity=${userData.uid};`,
        },
    });
    let data;
    try {
        data = (await res.json()).data;
    } catch {
        return handleAuthError();
    }
    return data;
}

// SERVER-DATA-SECTION
export async function getAllNotifications(): Promise<Notification[] | void> {
    const cookieStore = await cookies();
    const userData = await getUserDetailsFromToken(cookieStore.get("internal_token")?.value || "");
    if (!userData) {
        return handleAuthError();
    }
    try {
        const notifications = await db.notifications.findMany({
            where: {
                expiryDate: {
                    gte: new Date()
                }
            },
            select: {
                id: true,
                createDate: true,
                expiryDate: true,
                title: true,
                content: true,
                type: true,
                link: true,
                linkTitle: true,
            }
        });
        if (!notifications) {
            return [];
        }
        return notifications.map(notification => ({
            ...notification,
            expiryDate: notification.expiryDate.toISOString(),
            createDate: notification.createDate.toISOString(),

        }));
    } catch (e) {
        console.log(e);
        return handleAuthError();
    }
}

export async function getNotificationDetails(id: string) {
    const cookieStore = await cookies();
    const userData = await getUserDetailsFromToken(cookieStore.get("internal_token")?.value || "");
    if (!userData) {
        return handleAuthError();
    }
    try {
        const notification = await db.notifications.findUnique({
            where: {
                id
            },
            select: {
                id: true,
                createDate: true,
                expiryDate: true,
                title: true,
                content: true,
                type: true,
                link: true,
                linkTitle: true,
            }
        });
        return notification;
    } catch {
        return handleAuthError();
    }
}

export async function setNotificationAsRead({ notificationId }: { notificationId: string }) {
    try {
        if (!notificationId) {
            return handleAuthError();
        }
        const cookieStore = await cookies();
        const userData = await getUserDetailsFromToken(cookieStore.get("internal_token")?.value || "");
        if (!userData) {
            return handleAuthError();
        }
        if (!(await verifySession())) {
            return handleAuthError();
        }
        await db.notifications.update({
            where: { id: notificationId },
            data: {
                viewCount: {
                    increment: 1,
                }
            }
        });
        return;
    } catch {
        return handleAuthError();
    }
}

export async function updateServerData() {
    const cookieStore = await cookies();
    const userData = await getUserDetailsFromToken(cookieStore.get("internal_token")?.value || "");
    if (!userData) {
        return handleAuthError();
    }
    if (!(await verifySession())) {
        return handleAuthError();
    }
    const user = await db.user.findUnique({
        where: { id: userData.uid }
    });

    if (!user?.hasAcceptedSocialTerms) {
        return;
    };

    if (!user.school) {
        const school = await getUserDetails();
        if (school) {
            await db.user.update({
                where: { id: user.id },
                data: {
                    school: school.schoolName
                }
            });
        }
    }

    if (!user.average) {
        updateServerAverage(user.id);
    }
    if (!user.absencesHours || !user.delays) {
        updateServerPresenceData(user.id);
    }


    if (!user.name) {
        return "username_not_set";
    }

    const lastUpdate = user?.lastServerDataUpdate ? new Date(user.lastServerDataUpdate) : null;
    if (lastUpdate && (new Date().getTime() - lastUpdate.getTime()) < 8 * 60 * 60 * 1000) {
        return "updated";
    }

    updateServerAverage(user.id);
    updateServerPresenceData(user.id);
}

async function updateServerAverage(userId: string) {
    const marks: GradeType[] = await getMarks() as GradeType[];
    const totalAverage =
        marks
            .filter((mark) => mark.color !== "blue")
            .reduce((acc, mark) => acc + mark.decimalValue, 0) /
        marks.filter((mark) => mark.color !== "blue").length;
    await db.user.update({
        where: { id: userId },
        data: {
            average: totalAverage,
            lastServerDataUpdate: new Date()
        }
    });
}

async function updateServerPresenceData(userId: string) {
    const presenceData = await getPresence();
    if (presenceData && presenceData.delaysNumber !== undefined && presenceData.absenceHours !== undefined) {
        await db.user.update({
            where: { id: userId },
            data: {
                delays: presenceData.delaysNumber,
                absencesHours: presenceData.absenceHours,
                lastServerDataUpdate: new Date()
            }
        });
    }
}

export async function setUserName(username: string) {
    const cookieStore = await cookies();
    const userData = await getUserDetailsFromToken(cookieStore.get("internal_token")?.value || "");
    if (!userData) {
        return handleAuthError();
    }
    if (username.length > 13) {
        return "Username troppo lungo, massimo 13 caratteri.";
    }
    if (!/^[a-zA-Z0-9-_.!]+$/.test(username)) {
        return "L'username può contenere solo lettere, numeri, trattini, underscore, punti e punti esclamativi.";
    }
    if (username.toLowerCase() === "anonimo") {
        return "Questo username è riservato.";
    }
    if (!(await verifySession())) {
        return handleAuthError();
    }
    try {
        await db.user.update({
            where: { id: userData.uid },
            data: {
                name: username
            }
        });
    } catch (error) {
        if ((error as { code: string }).code === 'P2002') {
            return "Questo username è già stato preso.";
        }
        throw error;
    }
}