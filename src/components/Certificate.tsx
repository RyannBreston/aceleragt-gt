'use client';

import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Button } from './ui/button';
import { Download, Loader2, Award } from 'lucide-react';
import { Logo } from './icons/logo'; // Mantido o seu caminho original que sabemos que funciona.

// --- Interface de Props (sem alterações) ---
interface CertificateProps {
  courseTitle: string;
  sellerName: string;
}

// --- Componente de Apresentação (Apenas o Visual do Certificado) ---
// Separámos o visual para facilitar a manutenção.
const CertificateDisplay = React.forwardRef<HTMLDivElement, CertificateProps>(({ courseTitle, sellerName }, ref) => {
  const today = new Date();
  const emissionDate = today.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const cityState = "Dias d'Ávila, Bahia";

  return (
    <div
      ref={ref}
      className="bg-gray-900 text-white aspect-[1.414/1] w-full max-w-4xl mx-auto p-2 rounded-lg shadow-2xl border-2 border-amber-400/50 relative overflow-hidden"
      style={{
        backgroundImage: `radial-gradient(circle, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
        backgroundSize: '20px 20px',
      }}
    >
      <div className="w-full h-full p-8 md:p-10 border-2 border-amber-400/80 rounded-md flex flex-col items-center justify-between text-center">
        <header className="w-full flex justify-between items-start">
          <div className="flex items-center gap-3 opacity-90">
            <Logo className="size-8 text-amber-400" />
            <span className="font-semibold text-xl tracking-wide">Acelera GT</span>
          </div>
        </header>

        <main className="flex-grow flex flex-col justify-center items-center -mt-8 px-4">
          <h1 className="text-3xl md:text-5xl font-bold tracking-wider text-amber-300 uppercase">
            Certificado de Conclusão
          </h1>
          <p className="mt-5 text-base md:text-lg text-gray-300">
            Este certificado é orgulhosamente concedido a
          </p>
          <h2 className="my-6 md:my-8 text-4xl md:text-6xl font-serif font-bold text-white tracking-wide border-b-2 border-amber-400 pb-4 px-6">
            {sellerName}
          </h2>
          <p className="max-w-3xl text-base md:text-lg text-gray-300">
            por ter concluído com sucesso o curso de formação profissional:
          </p>
          <h3 className="mt-4 text-xl md:text-3xl font-semibold text-amber-300">
            "{courseTitle}"
          </h3>
        </main>

        <footer className="w-full flex justify-between items-end">
          <div className="text-left text-xs text-gray-400 space-y-4">
            <div>
              <p className="font-bold border-t-2 border-gray-500 pt-2 w-48 text-center">Coordenação Acelera GT</p>
              <p className="text-center text-gray-500">Assinatura</p>
            </div>
            <p>Emitido em: {emissionDate}, {cityState}</p>
          </div>
          <div className="flex flex-col items-center">
            <Award className="size-16 text-amber-400 opacity-80" />
            <p className="text-xs font-semibold text-amber-400/80 mt-1">SELO DE QUALIDADE</p>
          </div>
        </footer>
      </div>
    </div>
  );
});
// Adicionar um nome de exibição para facilitar a depuração no React DevTools
CertificateDisplay.displayName = 'CertificateDisplay';


// --- Componente Principal (Controlador) ---
export const Certificate = ({ courseTitle, sellerName }: CertificateProps) => {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!certificateRef.current) {
      console.error("A referência ao certificado não foi encontrada.");
      return;
    }

    setIsDownloading(true);
    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });

      const filename = `certificado_${courseTitle.replace(/\s+/g, '_')}_${sellerName.replace(/\s+/g, '_')}`.toLowerCase();
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${filename}.pdf`);

    } catch (error) {
      console.error("Erro ao gerar o PDF:", error);
      alert("Ocorreu um erro ao gerar o certificado. Por favor, tente novamente.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-gray-800/50 p-4 md:p-8 rounded-xl backdrop-blur-sm w-full">
      {/* O componente de visualização do certificado */}
      <CertificateDisplay ref={certificateRef} courseTitle={courseTitle} sellerName={sellerName} />

      {/* O botão de controlo */}
      <div className="mt-8 text-center">
        <Button
          onClick={handleDownload}
          disabled={isDownloading}
          className="bg-amber-500 text-gray-900 hover:bg-amber-400 font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-70 disabled:scale-100 disabled:cursor-not-allowed"
          aria-label="Fazer download do certificado em PDF"
        >
          {isDownloading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              A gerar PDF...
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
