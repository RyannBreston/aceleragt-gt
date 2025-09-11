'use client';
import SaveAllButton from '@/components/SaveAllButton';

async function salvarTudoAPI() {
  const response = await fetch('/api/salvar-tudo', { method: 'POST' });
  if (!response.ok) throw new Error('Falha ao salvar');
}

export default function DashboardPage() {
  return (
    <div>
      {/* ...outros componentes... */}
      <SaveAllButton onSave={salvarTudoAPI} />
    </div>
  );
}