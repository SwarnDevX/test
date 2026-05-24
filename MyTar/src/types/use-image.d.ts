declare module 'use-image' {
  type CrossOrigin = 'anonymous' | 'use-credentials' | '' | undefined;
  type ReferrerPolicy = 'no-referrer' | 'no-referrer-when-downgrade' | 'origin' | 'origin-when-cross-origin' | 'same-origin' | 'strict-origin' | 'strict-origin-when-cross-origin' | 'unsafe-url' | undefined;

  function useImage(
    url: string,
    crossOrigin?: CrossOrigin,
    referrerpolicy?: ReferrerPolicy
  ): [HTMLImageElement | undefined, 'loading' | 'loaded' | 'failed'];

  export = useImage;
}

