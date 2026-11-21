/** Oferece um texto como arquivo para baixar (nada sai do aparelho além do arquivo que a pessoa guarda). */
export function downloadText(text: string, filename: string, type: string): void {
 const url = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }));
 const link = document.createElement('a'); link.href = url; link.download = filename; document.body.append(link); link.click(); link.remove();
 window.setTimeout(() => URL.revokeObjectURL(url), 30000);
}
