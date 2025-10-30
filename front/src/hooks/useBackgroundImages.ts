export function useBackgroundImages() {
    const modules = import.meta.glob('../assets/*.png', {
        eager: true, import: 'default'
    }) as Record<string,string>;
    const urls = Object.entries(modules)
        .sort(([a],[b]) => {
            const na = parseInt(a.match(/(\d+)\.(jpg|jpeg|png)$/i)?.[1] ?? '0', 10);
            const nb = parseInt(b.match(/(\d+)\.(jpg|jpeg|png)$/i)?.[1] ?? '0', 10);
            return na - nb;
        })
        .map(([,url]) => url);
    return urls;
}