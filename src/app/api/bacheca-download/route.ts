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
        
        // Simply pass through the response from ClasseViva
        const arrayBuffer = await response.arrayBuffer();
        
        const headers = new Headers();
        
        // Forward relevant headers from the original response
        const contentType = response.headers.get('content-type');
        if (contentType) {
            headers.set('Content-Type', contentType);
        }
        
        const contentDisposition = response.headers.get('content-disposition');
        if (contentDisposition) {
            headers.set('Content-Disposition', contentDisposition);
        }
        
        // Set content-length based on actual arrayBuffer size
        headers.set('Content-Length', String(arrayBuffer.byteLength));
        
        return new NextResponse(arrayBuffer, {
            status: response.status,
            headers,
        });
    } catch (error) {
        console.error('Bacheca download error:', error);
        return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
    }
}
