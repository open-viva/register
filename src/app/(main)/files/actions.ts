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