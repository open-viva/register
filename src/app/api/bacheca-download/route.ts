import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const comId = searchParams.get('comId');
    const token = searchParams.get('token');
    const uid = searchParams.get('uid');
    
    if (!comId || !token || !uid) {
        return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }
    
    try {
        const downloadUrl = `https://web.spaggiari.eu/sif/app/default/bacheca_personale.php?action=file_download&com_id=${comId}`;
        
        const response = await fetch(downloadUrl, {
            headers: {
                'Cookie': `PHPSESSID=${token}; webidentity=${uid};`,
            },
            redirect: 'follow',
        });
        
        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to download file' }, { status: response.status });
        }
        
        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        const contentDisposition = response.headers.get('content-disposition') || '';
        
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
