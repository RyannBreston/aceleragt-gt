"use client";
import React, { useState } from 'react';

type SaveAllButtonProps = {
  onSave: () => Promise<void>;
  disabled?: boolean;
};

const SaveAllButton: React.FC<SaveAllButtonProps> = ({ onSave, disabled }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setSuccess(false);
    setError(null);
    try {
      await onSave();
      setSuccess(true);
    } catch (err) {
      console.error(err); // Agora 'err' está sendo usado
      setError('Erro ao salvar!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleClick} disabled={disabled || loading}>
        {loading ? 'Salvando...' : 'Salvar tudo'}
      </button>
      {success && <span style={{ color: 'green' }}>Salvo com sucesso!</span>}
      {error && <span style={{ color: 'red' }}>{error}</span>}
    </div>
  );
};

export default SaveAllButton;