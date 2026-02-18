import { useState } from "react";

interface NumberInputProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

/**
 * A number input that handles leading zeros properly.
 * Stores a string internally so users can clear the field and type freely.
 */
const NumberInput = ({ value, onChange, min, max, step, className }: NumberInputProps) => {
  const [display, setDisplay] = useState<string>(String(value));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDisplay(raw);
    const parsed = raw === "" ? 0 : Number(raw);
    if (!isNaN(parsed)) onChange(parsed);
  };

  const handleBlur = () => {
    // On blur, sync display with the actual numeric value
    setDisplay(String(value));
  };

  // Keep display in sync when value changes externally (e.g. form reset)
  // Only update if the display doesn't match the value already
  const numericDisplay = display === "" ? 0 : Number(display);
  const effectiveDisplay = numericDisplay === value ? display : String(value);

  return (
    <input
      type="number"
      value={effectiveDisplay}
      onChange={handleChange}
      onBlur={handleBlur}
      min={min}
      max={max}
      step={step}
      className={className}
    />
  );
};

export default NumberInput;

