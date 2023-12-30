import { ALLOWED_EVM_CHAINS, ALLOWED_NETWORKS, DasApiAsset } from "@avernikoz/nft-sdk";
import { PublicKey } from "@solana/web3.js";
import { OwnedNft } from "alchemy-sdk";
import { JsonRpcSigner } from "ethers";
import { NFT_IMAGES_CORS_PROXY_URL } from "../../config/proxy.config";
import { EvmNft, SolanaCNft, SolanaNft, SuiNft } from "../../utils/types";
import { mapNftTokenTypeToContractStandard } from "./utils";

export function suiMapper(
    nfts: {
        name: string;
        url: string;
        description: string | null | undefined;
        kioskId: string;
        nftId: string;
        nftType: string;
    }[],
): SuiNft[] {
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
            network: ALLOWED_NETWORKS.Sui,
            nftId: nft.nftId,
            kioskId: nft.kioskId,
            nftType: nft.nftType,
        };
    });
}

export function evmMapper(data: OwnedNft[], signer: JsonRpcSigner, chainName: ALLOWED_EVM_CHAINS): EvmNft[] {
    const proxy = NFT_IMAGES_CORS_PROXY_URL;
    const rawData = data.map((nft, index) => {
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

        const mappedContractType = mapNftTokenTypeToContractStandard(nft.contract.tokenType);

        return {
            name: nft.title,
            logoURI: ipfsHash,
            id: index,
            contractAddress: nft.contract.address,
            contractType: mappedContractType,
            nftTokenId: nft.tokenId,
            evmNetworkType: chainName,
            network: ALLOWED_NETWORKS[chainName],
        };
    });
    const filteredNfts = rawData.filter((el): el is EvmNft => el.contractType !== null);

    return filteredNfts;
}

export function solanaNFTMapper(
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
): SolanaNft[] {
    return nfts.map((item, i) => ({
        logoURI: item.logoURI,
        name: item.name,
        id: i,
        solanaAccount: item.accounts,
        cNFT: false,
        network: ALLOWED_NETWORKS.Solana,
    }));
}

export function solanaCNFTMapper(nfts: DasApiAsset[]): SolanaCNft[] {
    const cNFTsTransformed = nfts
        .map((item, i) => {
            const links = item.content.links;

            if (!(links && "image" in links && links.image && typeof links.image === "string")) {
                return null;
            }

            return {
                logoURI: links.image as string,
                name: item.content.metadata.name,
                nftId: item.id.toString(),
                id: i,
                network: ALLOWED_NETWORKS.Solana,
                cNFT: true,
            };
        })
        .filter((el): el is Exclude<typeof el, null> => el !== null);

    return cNFTsTransformed;
}
