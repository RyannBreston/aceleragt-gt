'use client';

import React, { forwardRef } from 'react';
import { Input, InputProps } from '@/components/ui/input';
import { NumericFormat, NumericFormatProps } from 'react-number-format';

interface CurrencyInputProps extends Omit<InputProps, 'onChange' | 'value'> {
  value?: number | string;
  onValueChange?: (value?: number) => void;
}

const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onValueChange, ...props }, ref) => { // Corrigido: 'onValue-change' para 'onValueChange'
    return (
      <NumericFormat
        {...(props as unknown as NumericFormatProps)}
        getInputRef={ref}
        value={value === undefined || value === null ? '' : value}
        onValueChange={(values) => {
            onValueChange?.(values.floatValue);
        }}
        thousandSeparator="."
        decimalSeparator=","
        prefix="R$ "
        decimalScale={2}
        fixedDecimalScale
        allowNegative={false}
        customInput={Input}
      />
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';

export { CurrencyInput };