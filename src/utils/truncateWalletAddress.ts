export function truncateWalletAddress(address: string | undefined): string {
    if (!address || address.length <= 8) {
        // Handle invalid or short addresses, or the case when address is undefined
        return address || "";
    }

    const prefix: string = address.slice(0, 4);
    const suffix: string = address.slice(-4);

    return `${prefix}...${suffix}`;
}
