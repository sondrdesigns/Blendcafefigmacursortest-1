import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { useApp } from '../lib/AppContext';

interface BackButtonProps {
  onNavigate: (page: string) => void;
}

export function BackButton({ onNavigate }: BackButtonProps) {
  const { goBack } = useApp();

  const handleBack = () => {
    const previousPage = goBack();
    if (previousPage) {
      onNavigate(previousPage);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className="gap-2 mb-4 hover:bg-secondary"
    >
      <ArrowLeft className="w-4 h-4" />
      <span>Back</span>
    </Button>
  );
}
