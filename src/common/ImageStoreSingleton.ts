export class ImageStoreSingleton {
    private readonly cache: {
        img: { url: string | null };
    } = { img: { url: null } };

    private static _instance: ImageStoreSingleton;

    public static getInstance(): ImageStoreSingleton {
        if (!ImageStoreSingleton._instance) {
            const instance = new ImageStoreSingleton();

            ImageStoreSingleton._instance = instance;
        }
        return ImageStoreSingleton._instance;
    }

    public getImageUrl() {
        return this.cache.img.url;
    }

    public setImageUrl(url: string) {
        this.cache.img.url = url;
    }
}
