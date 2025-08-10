'use client';

import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import jspdf from 'jspdf';
import { Button } from '@/components/ui/button';
import { Download, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/client-utils';

type PerformanceLevel = 'bronze' | 'silver' | 'gold' | 'platinum';

interface CertificateProps {
  sellerName: string;
  courseName: string;
  completionDate: string;
  performanceLevel?: PerformanceLevel;
  verificationUrl: string;
}

const levelConfig: Record<PerformanceLevel, { label: string; color: string; }> = {
  bronze: { label: 'Bronze', color: '#CD7F32' },
  silver: { label: 'Prata', color: '#C0C0C0' },
  gold: { label: 'Ouro', color: '#FFD700' },
  platinum: { label: 'Platina', color: '#E5E4E2' },
};

export const Certificate: React.FC<CertificateProps> = ({
  sellerName,
  courseName,
  completionDate,
  performanceLevel,
  verificationUrl,
}) => {
  const certificateRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleDownload = async () => {
    if (!certificateRef.current) return;
    
    toast({ title: "A gerar PDF...", description: "O seu certificado está a ser preparado." });

    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 3, 
        useCORS: true,
        backgroundColor: null,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jspdf({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`Certificado-${courseName.replace(/\s/g, '_')}-${sellerName.replace(/\s/g, '_')}.pdf`);
      
      toast({ title: "Download Concluído!", description: "O seu certificado foi descarregado com sucesso." });
    } catch {
      toast({ variant: "destructive", title: "Erro!", description: "Não foi possível gerar o certificado. Tente novamente." });
    }
  };
  
  const levelStyles = performanceLevel ? levelConfig[performanceLevel] : null;

  return (
    <>
      <div ref={certificateRef} className="p-10 bg-white text-gray-800 w-[1000px] aspect-[1.414] relative overflow-hidden font-serif border-8 border-gray-300 shadow-2xl">
        <div className="absolute inset-0 bg-texture-noise opacity-10"></div>
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center">

          <div className="absolute top-8 right-8">
            <QRCodeSVG value={verificationUrl} size={80} bgColor="#ffffff" fgColor="#333333" level="Q" />
          </div>

          <Award className="size-24 text-yellow-500 mb-4" />

          <h1 className="text-5xl font-bold tracking-wider mb-2">CERTIFICADO DE CONCLUSÃO</h1>
          <p className="text-xl mb-8">Este certificado é concedido a</p>

          <h2 className="text-6xl font-extrabold text-blue-800 tracking-wide">{sellerName}</h2>

          <p className="text-xl my-8 max-w-3xl">por ter concluído com sucesso o curso de formação profissional em:</p>

          <h3 className="text-4xl font-semibold mb-4">{courseName}</h3>

          {levelStyles && (
            <p 
              className={cn("text-2xl font-bold py-1 px-4 rounded-md", `bg-[${levelStyles.color}]/10`)} 
              style={{ color: levelStyles.color, borderColor: levelStyles.color, borderWidth: 2, borderStyle: 'solid' }}
            >
              Nível de Desempenho: {levelStyles.label}
            </p>
          )}

          <div className="mt-auto flex justify-between w-full text-sm">
            <div>
              <p className="border-t-2 border-gray-600 pt-2 font-semibold">Data de Conclusão</p>
              <p>{completionDate}</p>
            </div>
            <div>
              <p className="border-t-2 border-gray-600 pt-2 font-semibold">[Nome da Empresa]</p>
              <p>Diretor de Formação</p>
            </div>
          </div>
        </div>
      </div>
      <Button onClick={handleDownload} className="mt-6">
        <Download className="mr-2" />
        Descarregar Certificado
      </Button>
    </>
  );
};
