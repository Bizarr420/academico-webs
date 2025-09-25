declare module 'node:path' {
  const path: {
    resolve: (...paths: string[]) => string;
    dirname: (path: string) => string;
  };

  export default path;
}

declare module 'node:url' {
  export function fileURLToPath(url: string | URL): string;
}

interface ImportMeta {
  url: string;
}
