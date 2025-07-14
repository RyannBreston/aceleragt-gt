'use client';

import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Button } from './ui/button';
import { Download, Loader2 } from 'lucide-react';

interface CertificateProps {
  courseTitle: string;
  sellerName: string;
}

export const Certificate = ({ courseTitle, sellerName }: CertificateProps) => {
    const certificateRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = React.useState(false);

    const handleDownload = async () => {
        if (!certificateRef.current) return;
        setIsDownloading(true);

        try {
            const canvas = await html2canvas(certificateRef.current, {
                scale: 2,
                backgroundColor: null,
            });
            const imgData = canvas.toDataURL('image/png');
            
            // PDF em modo paisagem (landscape)
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`certificado-${courseTitle.replace(/ /g, '_')}.pdf`);
        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
        } finally {
            setIsDownloading(false);
        }
    };
    
    return (
        <div>
            <div ref={certificateRef} className="bg-white text-gray-800 p-8 rounded-lg shadow-2xl max-w-2xl mx-auto border-4 border-yellow-400">
                <div className="text-center border-b-2 pb-4 border-gray-300">
                <h1 className="text-4xl font-bold text-gray-700">CERTIFICADO DE CONCLUSÃO</h1>
                <p className="text-lg mt-2">Este certificado é concedido a</p>
                </div>
                <div className="text-center my-8">
                <h2 className="text-5xl font-extrabold text-primary">{sellerName}</h2>
                </div>
                <div className="text-center">
                <p className="text-lg">por ter concluído com sucesso o curso</p>
                <h3 className="text-2xl font-semibold mt-2 text-gray-600">"{courseTitle}"</h3>
                <p className="text-sm mt-8">Emitido em: {new Date().toLocaleDateString('pt-BR')}</p>
                </div>
            </div>
            <div className="mt-4 text-center">
                <Button onClick={handleDownload} disabled={isDownloading}>
                    {isDownloading ? <Loader2 className="mr-2 animate-spin" /> : <Download className="mr-2" />}
                    Baixar Certificado
                </Button>
            </div>
        </div>
    );
};