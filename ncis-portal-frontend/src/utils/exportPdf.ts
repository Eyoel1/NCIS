export function exportToPrintPdf(title: string): void {
  const originalTitle = document.title;
  document.title = `NCIS Portal - ${title}`;
  window.print();
  document.title = originalTitle;
}
