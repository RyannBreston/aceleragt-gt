'use client';

import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Button } from './ui/button';
import { Download, Loader2, Award } from 'lucide-react';
import { Logo } from './icons/logo'; // Reutilizamos o seu logo

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
                scale: 2.5, // Aumentar a escala para melhor qualidade no PDF
                backgroundColor: null,
                useCORS: true,
            });
            const imgData = canvas.toDataURL('image/png');
            
            // PDF em modo paisagem (landscape)
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`certificado-${courseTitle.replace(/\s+/g, '_')}-${sellerName.replace(/\s+/g, '_')}.pdf`);
        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
        } finally {
            setIsDownloading(false);
        }
    };
    
    return (
        <div className="bg-gray-800/50 p-4 md:p-8 rounded-xl backdrop-blur-sm">
            <div ref={certificateRef} className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white aspect-[1.414/1] w-full max-w-4xl mx-auto p-2 rounded-lg shadow-2xl border-2 border-yellow-400/50">
                <div className="w-full h-full p-6 md:p-10 border-2 border-yellow-400/80 rounded-md flex flex-col items-center justify-between text-center">

                    {/* Cabeçalho */}
                    <div className="w-full flex justify-between items-center">
                        <div className="flex items-center gap-2 opacity-80">
                            <Logo />
                            <span className="font-semibold text-lg">Acelera GT</span>
                        </div>
                        <span className="text-xs text-gray-400">Emitido em: {new Date().toLocaleDateString('pt-BR')}</span>
                    </div>

                    {/* Corpo Principal */}
                    <div className="flex-grow flex flex-col justify-center items-center">
                        <h1 className="text-2xl md:text-4xl font-bold tracking-wider text-yellow-300 uppercase">Certificado de Conclusão</h1>
                        <p className="mt-4 text-base md:text-lg text-gray-300">Este certificado é orgulhosamente concedido a</p>
                        
                        <h2 className="my-6 md:my-8 text-4xl md:text-6xl font-serif font-bold text-white tracking-wide border-b-2 border-yellow-400 pb-4 px-4">
                            {sellerName}
                        </h2>
                        
                        <p className="max-w-2xl text-base md:text-lg text-gray-300">
                            por ter concluído com sucesso o curso de formação profissional intitulado:
                        </p>
                        <h3 className="mt-4 text-xl md:text-2xl font-semibold text-yellow-300">
                            "{courseTitle}"
                        </h3>
                    </div>

                    {/* Rodapé e Selo */}
                    <div className="w-full flex justify-between items-end">
                        <div className="text-left">
                            <p className="text-sm font-bold border-t-2 border-gray-500 pt-2 w-48 text-center">Coordenação Acelera GT</p>
                            <p className="text-xs text-gray-400 text-center">Assinatura</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <Award className="size-16 text-yellow-400 opacity-80" />
                            <p className="text-xs font-semibold text-yellow-400/80 mt-1">SELO DE QUALIDADE</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="mt-6 text-center">
                <Button onClick={handleDownload} disabled={isDownloading} className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold py-3 px-6 rounded-lg shadow-lg transition-transform duration-200 hover:scale-105">
                    {isDownloading ? <Loader2 className="mr-2 animate-spin" /> : <Download className="mr-2" />}
                    Baixar Certificado em PDF
                </Button>
            </div>
        </div>
    );
};