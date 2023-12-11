import { JsonRpcSigner } from "ethers";
import { NFT_IMAGES_CORS_PROXY_URL } from "../../config/proxy.config";
import { OwnedNft } from "alchemy-sdk";
import { INft } from "../../utils/types";
import { PublicKey } from "@solana/web3.js";
import { evm } from "@avernikoz/nft-sdk";

export function suiMapper(
    nfts: {
        name: string;
        url: string;
        description: string;
        kioskId: string;
        nftId: string;
        nftType: string;
    }[],
): INft[] {
    const proxy = NFT_IMAGES_CORS_PROXY_URL;
    return nfts.map((nft, index) => {
        let ipfsHash = nft.url;
        if (ipfsHash.includes("https://")) {
            ipfsHash = proxy + ipfsHash;
        }
        if (ipfsHash.includes("ipfs://")) {
            ipfsHash = "https://ipfs.io/ipfs/" + ipfsHash.replace("ipfs://", "");
        }
        return {
            name: nft.name,
            logoURI: ipfsHash,
            id: index,
            nftId: nft.nftId,
            kioskId: nft.kioskId,
            nftType: nft.nftType,
        };
    });
}

export function evmMapper(data: OwnedNft[], signer: JsonRpcSigner): INft[] {
    const proxy = NFT_IMAGES_CORS_PROXY_URL;
    return data.map((nft, index) => {
        let ipfsHash = nft.rawMetadata?.image;
        if (!ipfsHash) {
            ipfsHash = "../../assets/svg/empty.jpg";
        }
        if (ipfsHash.includes("https://")) {
            ipfsHash = proxy + ipfsHash;
        }
        if (ipfsHash.includes("ipfs://")) {
            ipfsHash = "https://ipfs.io/ipfs/" + ipfsHash.replace("ipfs://", "");
        }
        return {
            name: nft.title,
            logoURI: ipfsHash,
            id: index,
            contractAddress: nft.contract.address,
            contractType: nft.contract.tokenType,
            nftTokenId: nft.tokenId,
            owner: signer,
            evm: evm.ALLOWED_EVM_CHAINS.Polygon,
        };
    });
}

export function solanaMapper(
    nfts: {
        name: string;
        logoURI: string;
        raw: {
            metadataAccount: string;
            mint: unknown;
            tokenAccount: string;
            masterEditionPDA: string;
            collectionMetadata: string | undefined;
            isMasterEdition: boolean;
        };
        accounts: {
            metadataAccount: PublicKey;
            mint: PublicKey;
            tokenAccount: PublicKey;
            masterEditionPDA: PublicKey;
            collectionMetadata: PublicKey | undefined;
            isMasterEdition: boolean;
        };
    }[],
): INft[] {
    return nfts.map((item, i) => ({
        logoURI: item.logoURI,
        name: item.name,
        id: i,
        solanaAccount: item.accounts,
    }));
}
