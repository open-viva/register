"use server";

import { verifySession } from "@/app/(auth)/auth/actions";
import { handleAuthError } from "@/lib/api";
import { db } from "@/lib/db";
import { hasPermission, PERMISSIONS } from "@/lib/perms";
import { getUserDetailsFromToken } from "@/lib/utils";
import { cookies } from "next/headers";

export async function createPost({ content, feed, isAnon }: { content: string, feed?: string, isAnon?: boolean }) {
    try {
        const cookieStore = await cookies();
        const userData = await getUserDetailsFromToken(cookieStore.get("internal_token")?.value || "");
        if (!userData) {
            return handleAuthError();
        }
        if (!(await verifySession())) {
            return handleAuthError();
        }
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
        if (!content) {
            return "Lo spot non puó essere vuoto";
        }
        if (content.length > 500) {
            return "Lo spot puó contenere al massimo 500 caratteri";
        }
        if (!feed) {
            feed = "main";
        }
        let authorId: string | null = userData.internalId as string;
        if (isAnon) {
            authorId = null;
        }
        await db.post.create({
            data: {
                content,
                feed,
                authorId,
            }
        });
        return;
    } catch {
        return handleAuthError();
    }
}

export async function getNewPosts({ feed }: { feed?: string }) {
    try {
        const cookieStore = await cookies();
        const userData = await getUserDetailsFromToken(cookieStore.get("internal_token")?.value || "");
        if (!userData) {
            return handleAuthError();
        }
        if (!(await verifySession())) {
            return handleAuthError();
        }
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
        if (!feed) {
            feed = "main";
        }
        const posts = await db.post.findMany({
            where: {
                feed,
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 100,
            include: {
                author: {
                    select: {
                        name: true,
                        permissions: true,
                    },
                },
                likes: {
                    select: {
                        userId: true,
                    },
                }
            },
        });
        const userId = userData.internalId;
        const user = await db.user.findUnique({
            where: {
                internalId: userId,
            },
            select: {
                permissions: true,
            },
        });
        if (!user) {
            return handleAuthError();
        }
        const postsWithLikes = posts.map(post => ({
            ...post,
            isLikedByUser: post.likes.some(like => like.userId === userId),
            canUserDeletePost: post.authorId === userId || (user.permissions && (hasPermission(user.permissions, PERMISSIONS.MOD) || hasPermission(user.permissions, PERMISSIONS.OWNER))) ? true : false,
        }));
        return postsWithLikes;
    } catch {
        return handleAuthError();
    }
}

export async function getTopPosts({ feed }: { feed?: string }) {
    try {
        const cookieStore = await cookies();
        const userData = await getUserDetailsFromToken(cookieStore.get("internal_token")?.value || "");
        if (!userData) {
            return handleAuthError();
        }
        if (!(await verifySession())) {
            return handleAuthError();
        }
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
        if (!feed) {
            feed = "main";
        }
        const posts = await db.post.findMany({
            where: {
                feed,
            },
            orderBy: {
                likes: {
                    _count: "desc",
                },
            },
            take: 100,
            include: {
                author: {
                    select: {
                        name: true,
                        permissions: true
                    },
                },
                likes: {
                    select: {
                        userId: true,
                    },
                }
            },
        });
        const userId = userData.internalId
        const user = await db.user.findUnique({
            where: {
                internalId: userId,
            },
            select: {
                permissions: true,
            },
        });
        if (!user) {
            return handleAuthError();
        }
        const postsWithLikes = posts.map(post => ({
            ...post,
            isLikedByUser: post.likes.some(like => like.userId === userId),
            canUserDeletePost: post.authorId === userId || (user.permissions && (hasPermission(user.permissions, PERMISSIONS.MOD) || hasPermission(user.permissions, PERMISSIONS.OWNER))) ? true : false,
        }));
        return postsWithLikes;
    } catch {
        return handleAuthError();
    }
}


export async function togglePostLike({ postId }: { postId: string }) {
    try {
        const cookieStore = await cookies();
        const userData = await getUserDetailsFromToken(cookieStore.get("internal_token")?.value || "");
        if (!userData) {
            return handleAuthError();
        }
        if (!(await verifySession())) {
            return handleAuthError();
        }
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
        const userId = userData.internalId;
        const post = await db.post.findUnique({
            where: {
                id: postId,
            },
            select: {
                likes: {
                    where: {
                        userId,
                    },
                },
            },
        });
        if (post?.likes.length) {
            await db.post.update({
                where: {
                    id: postId,
                },
                data: {
                    likes: {
                        deleteMany: {
                            userId,
                        },
                    },
                },
            });
        } else {
            await db.post.update({
                where: {
                    id: postId,
                },
                data: {
                    likes: {
                        create: {
                            userId,
                        },
                    },
                },
            });
        }
        return;
    } catch {
        return handleAuthError();
    }
}
export async function deletePost({ postId }: { postId: string }) {
    try {
        const cookieStore = await cookies();
        const userData = await getUserDetailsFromToken(cookieStore.get("internal_token")?.value || "");
        if (!userData) {
            return handleAuthError();
        }
        if (!(await verifySession())) {
            return handleAuthError();
        }
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
        const userId = userData.internalId;
        if (!userId) {
            return handleAuthError();
        }
        const user = await db.user.findUnique({
            where: {
                internalId: userId,
            },
            select: {
                permissions: true,
            },
        });
        if (!user) {
            return handleAuthError();
        }
        const post = await db.post.findUnique({
            where: {
                id: postId,
            },
            select: {
                authorId: true,
            },
        });
        if (!post || (post.authorId !== userId && !(hasPermission(user.permissions, PERMISSIONS.MOD) || hasPermission(user.permissions, PERMISSIONS.OWNER)))) {
            return handleAuthError();
        }
        await db.postLikeInteraction.deleteMany({
            where: {
                postId,
            },
        });
        await db.post.delete({
            where: {
                id: postId,
            }
        });
        return;
    } catch {
        return handleAuthError();
    }
}
