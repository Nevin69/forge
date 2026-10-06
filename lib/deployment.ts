// The Pages build declares its repository path in index.html. The original
// hosted build has no meta tag and continues to use the domain root.
export function assetUrl(file: string): string {
  const base =
    typeof document === "undefined"
      ? "/"
      : document.querySelector<HTMLMetaElement>('meta[name="forge-base"]')
          ?.content || "/";
  return `${base.replace(/\/$/, "")}/${file.replace(/^\//, "")}`;
}
