"use server";

import { handleAuthError } from "@/lib/api";
import { getUserDetailsFromToken } from "@/lib/utils";
import { cookies } from "next/headers";

export async function getBacheca() {
    const userData = await getUserDetailsFromToken(cookies().get("internal_token")?.value || "");
    if (!userData) {
        return handleAuthError();
    }
    const formData = new FormData();
    formData.append("action", "get_comunicazioni");
    const res = await fetch(`https://web.spaggiari.eu/sif/app/default/bacheca_personale.php`, {
        method: "POST",
        headers: {
            "Cookie": `PHPSESSID=${cookies().get("token")?.value}; webidentity=${userData.uid};`,
        },
        body: formData
    });
    let data;
    try {
        data = await res.json();
    } catch {
        return handleAuthError();
    }
    return data;
}

export async function setReadBachecaItem(itemId: string) {
    const userData = await getUserDetailsFromToken(cookies().get("internal_token")?.value || "");
    if (!userData) {
        return handleAuthError();
    }
    const formData = new FormData();
    formData.append("action", "read_all");
    formData.append("id_relazioni", `[${itemId}]`);
    await fetch(`https://web.spaggiari.eu/sif/app/default/bacheca_personale.php`, {
        method: "POST",
        headers: {
            "Cookie": `PHPSESSID=${cookies().get("token")?.value}; webidentity=${userData.uid};`,
        },
        body: formData
    });
    return true;
}

export async function getBachecaFileUrl(comId: string): Promise<string | void> {
    const userData = await getUserDetailsFromToken(cookies().get("internal_token")?.value || "");
    if (!userData) {
        return handleAuthError();
    }
    
    // Return the download URL with auth info encoded
    // The file download will be handled client-side using this URL
    const token = cookies().get("token")?.value;
    return `/api/bacheca-download?comId=${encodeURIComponent(comId)}&token=${encodeURIComponent(token || '')}&uid=${encodeURIComponent(userData.uid)}`;
}

export async function checkBachecaAttachment(comId: string): Promise<{ hasAttachment: boolean; fileName?: string }> {
    const userData = await getUserDetailsFromToken(cookies().get("internal_token")?.value || "");
    if (!userData) {
        return { hasAttachment: false };
    }
    
    // Validate comId format - should be alphanumeric to prevent URL injection
    if (!/^[a-zA-Z0-9_-]+$/.test(comId)) {
        return { hasAttachment: false };
    }
    
    const token = cookies().get("token")?.value;
    const downloadUrl = `https://web.spaggiari.eu/sif/app/default/bacheca_personale.php?action=file_download&com_id=${encodeURIComponent(comId)}`;
    
    // Create an AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
        const response = await fetch(downloadUrl, {
            method: 'GET',
            headers: {
                'Cookie': `PHPSESSID=${token}; webidentity=${userData.uid};`,
            },
            redirect: 'follow',
            signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            return { hasAttachment: false };
        }
        
        const contentType = response.headers.get('content-type') || '';
        const contentDisposition = response.headers.get('content-disposition') || '';
        
        // Check if the response is a file attachment (not HTML/text error page)
        const isAttachment = contentDisposition.includes('attachment') || 
            contentType.includes('application/pdf') ||
            contentType.includes('application/octet-stream') ||
            contentType.includes('image/') ||
            contentType.includes('application/zip') ||
            contentType.includes('application/msword') ||
            contentType.includes('application/vnd.') ||
            (!contentType.includes('text/html') && contentDisposition.length > 0);
        
        if (isAttachment) {
            // Extract filename from content-disposition header
            // Pattern matches: filename="name.ext" or filename=name.ext (with or without quotes)
            const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            const fileName = filenameMatch ? filenameMatch[1].replace(/['"]/g, '') : undefined;
            return { hasAttachment: true, fileName };
        }
        
        return { hasAttachment: false };
    } catch {
        clearTimeout(timeoutId);
        return { hasAttachment: false };
    }
}