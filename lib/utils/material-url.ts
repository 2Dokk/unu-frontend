export function isMaterialUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const isGoogleDrive = ["drive.google.com", "docs.google.com"].includes(
      host,
    );
    const isNotion = ["notion.com", "notion.so", "notion.site"].some(
      (allowed) => host === allowed || host.endsWith(`.${allowed}`),
    );

    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      (isGoogleDrive || isNotion)
    );
  } catch {
    return false;
  }
}
