import * as React from 'react';

/**
 * Canonical form-field styling for the whole app. Exported as a string so
 * large existing forms (e.g. fillndahtml's getFieldClass) can adopt it
 * without restructuring.
 */
export const inputClasses =
  'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-gray-400 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-700/30 focus:border-teal-700 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={`${inputClasses} ${className || ''}`} {...props} />
  )
);
Input.displayName = 'Input';

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={`${inputClasses} ${className || ''}`} {...props} />
));
Textarea.displayName = 'Textarea';

export { Input, Textarea };
