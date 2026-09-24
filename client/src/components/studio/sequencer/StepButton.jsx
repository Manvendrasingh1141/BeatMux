/**
 * StepButton — matches reference image:
 * inactive = very light lavender (#eeeef8), active = track colour
 */
export default function StepButton({ isActive, isCurrentStep, isEnabled = true, color, onClick, stepNumber }) {
  let cls = 'relative flex-1 rounded-lg transition-all duration-75 cursor-pointer focus-visible:outline-none select-none ';
  // height set by parent via h-8
  cls += 'h-8 ';

  if (!isEnabled) {
    cls += 'opacity-30 cursor-not-allowed ';
  }

  if (isCurrentStep && isActive) {
    cls += `${color} ring-2 ring-white ring-offset-1 scale-105 brightness-110`;
  } else if (isCurrentStep) {
    cls += 'bg-indigo-200 ring-2 ring-indigo-400 ring-offset-1 scale-[1.02]';
  } else if (isActive) {
    cls += `${color} hover:brightness-110`;
  } else {
    if (isEnabled) cls += 'hover:bg-[#d8d9ef]';
    // Light beat-group tint
    cls += (stepNumber - 1) % 4 === 0 ? ' bg-[#e0e1f2]' : ' bg-[#eeeef8]';
  }

  return (
    <button
      onClick={onClick}
      disabled={!isEnabled}
      className={cls}
      aria-label={`Step ${stepNumber} ${isActive ? 'on' : 'off'}`}
      aria-pressed={isActive}
    />
  );
}
