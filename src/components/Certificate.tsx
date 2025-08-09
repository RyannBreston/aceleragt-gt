/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Button } from './ui/button';
import { Download, Loader2, Award } from 'lucide-react';
import { Logo } from './icons/logo';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';

type PerformanceLevel = 'bronze' | 'silver' | 'gold' | 'platinum';

interface CertificateProps {
    courseTitle: string;
    sellerName: string;
    verificationCode: string;
    qrCodeValue: string;
    performanceLevel: PerformanceLevel;
    achievements: string[];
}

const levelStyles: Record<PerformanceLevel, { border: string; text: string; label: string }> = {
    bronze: { border: 'border-orange-700/80', text: 'text-orange-700', label: 'Bronze' },
    silver: { border: 'border-gray-500/80', text: 'text-gray-500', label: 'Prata' },
    gold: { border: 'border-amber-500/80', text: 'text-amber-500', label: 'Ouro' },
    platinum: { border: 'border-purple-500/80', text: 'text-purple-500', label: 'Platina' },
};

function slugify(str: string) {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '_')
        .replace(/[^\w\-]/g, '')
        .toLowerCase();
}

const CertificateDisplay = React.forwardRef<HTMLDivElement, CertificateProps>(
    ({ courseTitle, sellerName, verificationCode, qrCodeValue, performanceLevel }, ref) => {
        const today = new Date();
        const emissionDate = today.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
        const styles = levelStyles[performanceLevel];

        return (
            <div
                ref={ref}
                className="bg-white text-gray-800 aspect-[1.414/1] w-full max-w-4xl mx-auto p-4 rounded-lg shadow-2xl border border-gray-300 flex flex-col relative overflow-hidden"
            >
                <Logo className="absolute bottom-4 right-4 opacity-[0.05] w-48 h-48 text-gray-500 pointer-events-none select-none" />

                <div className={cn('w-full h-full p-8 border-2 rounded-md flex flex-col', styles.border)}>
                    <header className="w-full flex justify-center items-center mb-4">
                        <Logo className="w-24 h-24 text-gray-800" />
                    </header>

                    <main className="flex-grow flex flex-col justify-center items-center text-center py-4">
                        <p className="text-lg text-gray-600 tracking-widest uppercase font-sans">
                            Certificado de Conclusão
                        </p>
                        <div className={cn('w-20 h-px my-4', styles.border.replace('border-', 'bg-'))} />
                        <p className="text-base text-gray-500">Certificamos que</p>

                        <h2 className="mt-3 mb-2 text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-gray-900 break-words leading-tight">
                            {sellerName}
                        </h2>

                        <p className="text-base text-gray-500">
                            concluiu com sucesso o curso de formação:
                        </p>

                        <h3 className={cn('mt-3 text-xl md:text-2xl font-serif font-semibold break-words', styles.text)}>
                            {courseTitle}
                        </h3>
                    </main>

                    <footer className="flex justify-between items-end pt-4 text-sm text-gray-600">
                        <div className="flex items-end gap-4">
                            <QRCodeSVG
                                value={qrCodeValue}
                                size={70}
                                bgColor="#ffffff"
                                fgColor="#1f2937"
                                level="Q"
                                className="bg-white p-1 border rounded-md"
                            />
                            <div className="text-left text-xs">
                                <p className="font-semibold">Código de Verificação:</p>
                                <p className="font-mono text-gray-500 break-all">{verificationCode}</p>
                                <p className="mt-2">
                                    Emitido em: <span className="font-semibold">{emissionDate}</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col items-center">
                            <Award className={cn('w-14 h-14', styles.text)} />
                            <p className={cn('font-semibold text-sm mt-1', styles.text)}>
                                NÍVEL {styles.label.toUpperCase()}
                            </p>
                        </div>
                    </footer>
                </div>
            </div>
        );
    }
);
CertificateDisplay.displayName = 'CertificateDisplay';

export const Certificate = (props: CertificateProps) => {
    const certificateRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const { toast } = useToast();

    const handleDownload = async () => {
        if (!certificateRef.current) return;
        setIsDownloading(true);

        try {
            const canvas = await html2canvas(certificateRef.current, {
                scale: 3,
                useCORS: true,
                backgroundColor: '#ffffff',
            });
            
            const imgData = (canvas as any).toDataURL('image/png');
            // --- CORREÇÃO FINAL APLICADA AQUI ---
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [(canvas as any).width, (canvas as any).height],
                compress: true,
            });

            const filename = `certificado_${slugify(props.courseTitle)}_${slugify(
                props.sellerName
            )}.pdf`;
            
            // --- CORREÇÃO FINAL APLICADA AQUI ---
            pdf.addImage(imgData, 'PNG', 0, 0, (canvas as any).width, (canvas as any).height, undefined, 'FAST');
            pdf.save(filename);
        } catch (err) {
            console.error('Erro ao gerar PDF:', err);
            toast({
                variant: 'destructive',
                title: 'Erro ao Gerar Certificado',
                description: 'Ocorreu um problema ao criar o PDF. Tente novamente.',
            });
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="bg-gray-100 p-6 md:p-10 rounded-xl shadow-inner w-full">
            <CertificateDisplay ref={certificateRef} {...props} />
            <div className="mt-8 text-center">
                <Button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="bg-amber-700 text-white hover:bg-amber-600 font-bold py-3 px-8 rounded-lg shadow-md transition-all duration-300 hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
                    aria-label="Download do certificado"
                >
                    {isDownloading ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            A processar...
                        </>
                    ) : (
                        <>
                            <Download className="mr-2 h-5 w-5" />
                            Download do Certificado
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};