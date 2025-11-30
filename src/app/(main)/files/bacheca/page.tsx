"use client";
import { useEffect, useState } from "react";
import { getBacheca, getBachecaFileUrl, setReadBachecaItem } from "../actions";
import { BachecaType } from "@/lib/types";
import { Input } from "@/components/Input";
import { Download, Search, X } from "lucide-react";
import { Drawer, DrawerClose, DrawerContent, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useAutoAnimate } from "@formkit/auto-animate/react";

// The "richieste" field contains "A" when there's an attachment (Allegato in Italian)
const ATTACHMENT_INDICATOR = 'A';

type BachecaResponse = {
    read: BachecaType[];
    msg_new: BachecaType[];
}

export default function Page() {
    const [bachecaLoading, setBachecaLoading] = useState(true);
    const [bacheca, setBacheca] = useState<BachecaResponse>({
        read: [],
        msg_new: []
    });
    const [search, setSearch] = useState<string>('');
    const [parent] = useAutoAnimate();

    useEffect(() => {
        async function getBachecaItems() {
            const storedBacheca = window.sessionStorage.getItem('bacheca');
            if (storedBacheca) {
                setBacheca(JSON.parse(storedBacheca));
            } else {
                const res: BachecaResponse = await getBacheca();
                setBacheca(res);
                window.sessionStorage.setItem('bacheca', JSON.stringify(res));
            }
            setBachecaLoading(false);
        }
        getBachecaItems();
    }, []);
    return (
        <div>
            <div className="max-w-3xl relative p-4 pb-0 mt-4 mx-auto">
                <Search className="absolute top-6 left-6 z-10 text-secondary opacity-50" />
                <Input onChange={(e) => setSearch(e.target.value)} value={search} className="focus:outline-none text-base font-normal !py-2 pl-10" placeholder="Cerca nella bacheca" />
                {search && search.length > 0 && (
                    <div onClick={() => {
                        setSearch('');
                    }} className="w-5  -translate-x-1/2 absolute flex items-center justify-center h-full top-0 right-4">
                        <div className="w-5 h-5 mt-4 flex items-center justify-center rounded-full bg-secondary ">
                            <X size={12} className="text-background" />
                        </div>
                    </div>)}
            </div>
            <div ref={parent} className="max-w-3xl p-4 pt-0 mx-auto text-3xl font-semibold mt-4 flex flex-col gap-6">

                {!bachecaLoading && bacheca?.msg_new && bacheca?.msg_new.length !== 0 && (
                    <div ref={parent} className="border-b-[1px] px-1 border-red-950">
                        <p className="sticky py-4 top-0 bg-background z-10">Non letto ({bacheca?.msg_new.length})</p>
                        <div>
                            {bacheca?.msg_new.filter((item) =>
                                item.titolo.toLowerCase().includes(search.toLowerCase()) ||
                                item.testo.toLowerCase().includes(search.toLowerCase())
                            ).map((item, index) => (
                                <BachecaEntry key={index} bachecaItem={item} setBacheca={setBacheca} bacheca={bacheca} />
                            ))}
                        </div>
                    </div>
                )}
                {!bachecaLoading && bacheca?.read && bacheca?.read.length !== 0 && (
                    <div ref={parent} className="border-b-[1px] px-1 border-red-950">
                        <p className="sticky py-4 pt-6 top-0 bg-background z-10">Letto</p>
                        <div >
                            {bacheca?.read && bacheca?.read.filter((item) =>
                                item.titolo.toLowerCase().includes(search.toLowerCase()) ||
                                item.testo.toLowerCase().includes(search.toLowerCase())
                            ).map((item, index) => (
                                <BachecaEntry key={index} bachecaItem={item} setBacheca={setBacheca} bacheca={bacheca} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function BachecaEntry({ bachecaItem, setBacheca, bacheca }: { bachecaItem: BachecaType; setBacheca: React.Dispatch<React.SetStateAction<BachecaResponse>>; bacheca: BachecaResponse }) {
    const [isDownloading, setIsDownloading] = useState(false);
    
    // Check if there's an attachment available
    const hasAttachment = Boolean(bachecaItem.nome_file) || bachecaItem.richieste?.includes(ATTACHMENT_INDICATOR);
    
    // Get the button text for the download button
    const getDownloadButtonText = () => {
        if (isDownloading) return 'Scaricamento...';
        if (bachecaItem.nome_file) return `Scarica allegato: ${bachecaItem.nome_file}`;
        return 'Scarica allegato';
    };
    
    const handleDownload = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isDownloading) return;
        
        setIsDownloading(true);
        try {
            const downloadUrl = await getBachecaFileUrl(bachecaItem.id);
            if (downloadUrl) {
                // Create a temporary link to trigger download
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = bachecaItem.nome_file || 'allegato';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch (error) {
            console.error('Download error:', error);
        } finally {
            setIsDownloading(false);
        }
    };
    
    return (
        <Drawer disablePreventScroll={false}>
            <DrawerTrigger className="w-full focus:outline-none">
                <div className="border-t-[1px] overflow-hidden flex flex-col items-start text-left w-full py-4 pt-5 border-red-950">
                    <div className="flex items-start justify-between w-full">
                        <p className="text-lg font-semibold leading-6 ph-censor-text">{bachecaItem.titolo}</p>
                        {hasAttachment && (
                            <span className="ml-2 text-accent flex-shrink-0">
                                <Download size={18} />
                            </span>
                        )}
                    </div>
                    <p className="text-sm mt-0.5 text-secondary font-semibold ph-censor-text">{bachecaItem.tipo_com_desc} • {bachecaItem.evento_data}</p>
                    <p className="font-normal text-sm opacity-40 mt-1 ph-censor-text">
                        {bachecaItem?.testo?.length > 200
                            ? bachecaItem.testo.slice(0, 200) + '...'
                            : bachecaItem.testo}
                    </p>
                </div>
            </DrawerTrigger>
            <DrawerContent aria-describedby="" className="p-4 pb-12 max-w-3xl mx-auto">
                <DrawerTitle className="text-lg font-semibold leading-6 ph-censor-text">{bachecaItem.titolo}
                </DrawerTitle>
                <p className="text-sm mt-0.5 text-secondary font-semibold ph-censor-text">{bachecaItem.tipo_com_desc} • {bachecaItem.evento_data}</p>
                <p className="font-normal text-sm opacity-65 mt-6 whitespace-pre-line ph-censor-text">
                    {bachecaItem.testo.split(' ').map((word, index) => {
                        const urlPattern = /(https?:\/\/[^\s]+)/g;
                        return urlPattern.test(word) ? (
                            <a key={index} href={word} className="text-accent underline" target="_blank" rel="noopener noreferrer">
                                {word}
                            </a>
                        ) : (
                            word + ' '
                        );
                    })}
                </p>
                {hasAttachment && (
                    <Button 
                        onClick={handleDownload} 
                        variant="outline" 
                        className="mt-6 w-full flex items-center gap-2"
                        disabled={isDownloading}
                    >
                        <Download size={18} />
                        {getDownloadButtonText()}
                    </Button>
                )}
                {(!bacheca.msg_new || bacheca.msg_new.length === 0 || bacheca.msg_new.filter(item => item.id === bachecaItem.id).length === 0) ? <Button onClick={() => {
                    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
                }} className="mt-6 w-full">Chiudi</Button> : <><Button onClick={() => {
                    setReadBachecaItem(bachecaItem.id_relazione);
                    setBacheca({
                        ...bacheca,
                        msg_new: bacheca.msg_new.filter((item) => item.id_relazione !== bachecaItem.id_relazione),
                        read: Array.isArray(bacheca.read) ? [bachecaItem, ...bacheca.read] : [bachecaItem]
                    })
                    window.sessionStorage.setItem('bacheca', JSON.stringify({
                        ...bacheca,
                        msg_new: bacheca.msg_new.filter((item) => item.id_relazione !== bachecaItem.id_relazione),
                        read: Array.isArray(bacheca.read) ? [bachecaItem, ...bacheca.read] : [bachecaItem]
                    }));
                    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
                }} className="mt-6 w-full">Chiudi e segna come letto</Button>
                    <DrawerClose className="w-full pt-4 text-sm">
                        Chiudi senza segnare come letto
                    </DrawerClose></>}

            </DrawerContent>
        </Drawer>
    );
}