export class ImageStoreSingleton {
    private readonly cache: {
        img: { url: string | null; raw: TexImageSource | null };
    } = { img: { url: null, raw: null } };

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

    public setImageUrl(url: string | null) {
        this.cache.img.url = url;
    }

    public setImage(img: TexImageSource | null) {
        this.cache.img.raw = img;
    }

    public getImage() {
        return this.cache.img.raw;
    }
}
