import { useState } from 'react';

// Fast-forwards the rocket launch. It hides after one press because the flight is already finishing.
export default function SkipLaunchButton({ onSkip }) {
  const [wasPressed, setWasPressed] = useState(false);
  if (wasPressed) return null;

  function handleClick() {
    setWasPressed(true);
    onSkip();
  }

  return (
    <button type="button" onClick={handleClick} className="skip-button label fixed z-30 min-h-11 px-1 text-ink opacity-70 transition-opacity duration-250 text-shadow-space hover:opacity-100">
      Skip launch
    </button>
  );
}
