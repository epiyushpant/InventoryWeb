import { useState, FormEvent } from 'react';
import { ApiError } from '@/lib/api';

export function useFormValidation() {
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    const handleApiError = (err: any) => {
        if (err && (err.name === 'ApiError' || err.errors !== undefined)) {
            const apiErr = err as ApiError;
            if (apiErr.errors) {
                const errors: string[] = [];
                Object.entries(apiErr.errors).forEach(([field, messages]) => {
                    const prefix = field ? `${field}: ` : '';
                    if (Array.isArray(messages)) {
                        messages.forEach(msg => {
                            errors.push(`${prefix}${msg}`);
                        });
                    } else if (typeof messages === 'string') {
                        errors.push(`${prefix}${messages}`);
                    }
                });
                setValidationErrors(errors);
            } else {
                setValidationErrors([apiErr.message || 'An unexpected error occurred.']);
            }
        } else if (err instanceof Error) {
            setValidationErrors([err.message]);
        } else {
            setValidationErrors(['An unexpected error occurred.']);
        }
    };

    const validateAndSubmit = (
        e: FormEvent<HTMLFormElement>,
        onSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void> | void
    ) => {
        e.preventDefault();
        const form = e.currentTarget;

        if (!form.checkValidity()) {
            const errors: string[] = [];
            const elements = form.elements;
            for (let i = 0; i < elements.length; i++) {
                const el = elements[i] as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
                if (!el.validity?.valid) {
                    // Find a sensible label
                    let labelName = el.name || (el as any).placeholder || el.id || 'A field';
                    
                    // Try to extract from previous sibling label if structured that way
                    if (el.previousElementSibling?.tagName === 'LABEL') {
                        labelName = (el.previousElementSibling as HTMLLabelElement).innerText;
                    } else if (el.labels && el.labels.length > 0) {
                        labelName = el.labels[0].innerText;
                    }
                    
                    // Clean up the label text
                    labelName = labelName.replace(/\*/g, '').replace(':', '').trim();
                    if (!labelName) labelName = 'A required field';

                    // Use standard validation message but ensure it is capitalized
                    const msg = el.validationMessage;
                    errors.push(`${labelName}: ${msg}`);
                }
            }
            // Unique errors in case of multiple checks
            setValidationErrors(Array.from(new Set(errors)));
            return;
        }

        setValidationErrors([]);
        return onSubmit(e);
    };

    return { validationErrors, setValidationErrors, validateAndSubmit, handleApiError };
}
