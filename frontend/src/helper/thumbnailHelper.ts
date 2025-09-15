export type ThumbnailSizeType = 'small' | 'medium' | 'large' | 'original';
export const thumbnailSizes: ThumbnailSizeType[] = ['small','medium', 'large', 'original'];

export function getThumbnailClass(size: ThumbnailSizeType): string {
  const sizeClassMap: Record<ThumbnailSizeType, string> = {
    small: 'w-25',
    medium: 'w-50',
    large: 'w-75',
    original: 'w-100',
  };

  return sizeClassMap[size];
}

export function getInitialThumbnailSize(
    naturalWidth: number,
    naturalHeight: number,
    containerWidth: number = 1000,
    targetHeight: number = 550
): ThumbnailSizeType {
    const sizes = [
        {name: 'small', scale: 0.25},
        {name: 'medium', scale: 0.5},
        {name: 'large', scale: 0.75},
        {name: 'original', scale: 1},
    ] as const;

    let bestSize: ThumbnailSizeType = sizes[0].name;
    let smallestDiff = Infinity;

    for (const size of sizes) {
        const scaledWidth = containerWidth * size.scale;
        const estimatedHeight = (scaledWidth / naturalWidth) * naturalHeight;
        const diff = Math.abs(estimatedHeight - targetHeight);

        if (diff < smallestDiff) {
            smallestDiff = diff;
            bestSize = size.name;
        }
    }

    return bestSize;
}

export function getButtonOutline(){
    const currentTheme = document.documentElement.getAttribute('data-bs-theme'); // "light" or "dark"
    return currentTheme === "dark" ? "outline-light" : "outline-dark";
}

export const popupStyles= (showImagePopup: boolean) : React.CSSProperties => ({
    display: showImagePopup ? 'flex' : 'none',
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1050,
    cursor: 'zoom-out',
});

export const popupImgStyles: React.CSSProperties = {
    maxWidth: '90%',
    maxHeight: '90%',
    borderRadius: '8px',
};