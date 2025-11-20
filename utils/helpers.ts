export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:application/pdf;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const cleanCodeBlock = (text: string): string => {
  // 1. Try to find content within ```html and ``` fences (or just ``` and ```)
  const codeBlockRegex = /```(?:html)?\s*([\s\S]*?)```/i;
  const match = text.match(codeBlockRegex);
  if (match && match[1]) {
    return match[1].trim();
  }

  // 2. If no fences, look for <!DOCTYPE html> start
  const docTypeIndex = text.indexOf('<!DOCTYPE html>');
  if (docTypeIndex !== -1) {
    return text.substring(docTypeIndex).trim();
  }

  // 3. Fallback: just trim standard fences if they exist at start/end purely
  let cleaned = text.trim();
  if (cleaned.startsWith('```html')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  
  return cleaned.trim();
};

export const downloadHtml = (htmlContent: string, filename: string = 'visual.html') => {
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
