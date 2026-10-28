import type { FieldValues, UseFormSetError } from "react-hook-form";

interface FieldError {
  id: string;
  error: string;
}

/** Maps SuperTokens' FIELD_ERROR formFields onto the right react-hook-form field. */
export function applyFieldErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  formFields: FieldError[],
) {
  for (const field of formFields) {
    setError(field.id as never, { type: "server", message: field.error });
  }
}
