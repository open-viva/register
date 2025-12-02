import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const comId = searchParams.get('comId');
    const token = searchParams.get('token');
    const uid = searchParams.get('uid');
    
    if (!comId || !token || !uid) {
        return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }
    
    // Validate comId format - should start with alphanumeric and contain only alphanumeric, underscore, or hyphen
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(comId)) {
        return NextResponse.json({ error: 'Invalid comId format' }, { status: 400 });
    }
    
    try {
        const downloadUrl = `https://web.spaggiari.eu/sif/app/default/bacheca_personale.php?action=file_download&com_id=${encodeURIComponent(comId)}`;
        
        const response = await fetch(downloadUrl, {
            headers: {
                'Cookie': `PHPSESSID=${token}; webidentity=${uid}`,
            },
            redirect: 'follow',
        });
        
        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to download file' }, { status: response.status });
        }
        
        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        const contentDisposition = response.headers.get('content-disposition') || '';
        
        // Check if the response is HTML (error page from Spaggiari)
        // The Spaggiari server returns 200 OK with HTML when there's no attachment
        if (contentType.includes('text/html')) {
            return NextResponse.json({ error: 'No attachment available' }, { status: 404 });
        }
        
        // Check if the response is a valid file attachment
        // The contentDisposition header indicates a file attachment when present and non-empty
        const hasContentDisposition = contentDisposition.length > 0;
        const isAttachment = contentDisposition.includes('attachment') || 
            contentType.includes('application/pdf') ||
            contentType.includes('application/octet-stream') ||
            contentType.includes('image/') ||
            contentType.includes('application/zip') ||
            contentType.includes('application/msword') ||
            contentType.includes('application/vnd.') ||
            hasContentDisposition;
        
        if (!isAttachment) {
            return NextResponse.json({ error: 'No attachment available' }, { status: 404 });
        }
        
        const arrayBuffer = await response.arrayBuffer();
        
        const headers = new Headers();
        headers.set('Content-Type', contentType);
        if (contentDisposition) {
            headers.set('Content-Disposition', contentDisposition);
        }
        
        return new NextResponse(arrayBuffer, {
            status: 200,
            headers,
        });
    } catch (error) {
        console.error('Bacheca download error:', error);
        return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
    }
}
