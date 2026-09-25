import { Page } from '@playwright/test';

export type BrokenImage = {
  src: string;
  alt: string;
  naturalWidth: number;
  naturalHeight: number;
};

export async function collectBrokenImages(page: Page): Promise<BrokenImage[]> {
  return page.locator('img').evaluateAll((images) => images
    .map((image) => ({
      src: (image as HTMLImageElement).currentSrc || (image as HTMLImageElement).src,
      alt: (image as HTMLImageElement).alt,
      naturalWidth: (image as HTMLImageElement).naturalWidth,
      naturalHeight: (image as HTMLImageElement).naturalHeight,
    }))
    .filter((image) => image.naturalWidth === 0 || image.naturalHeight === 0));
}
