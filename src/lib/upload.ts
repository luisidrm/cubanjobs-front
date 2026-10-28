/** Appends a browser File to a FormData for upload. */
export function appendFilePart(
  formData: FormData,
  fieldName: string,
  file: File,
): void {
  formData.append(fieldName, file, file.name);
}
