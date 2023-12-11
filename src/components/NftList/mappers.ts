import { ALLOWED_EVM_CHAINS, ALLOWED_NETWORKS } from "@avernikoz/nft-sdk";
import { PublicKey } from "@solana/web3.js";
import { OwnedNft } from "alchemy-sdk";
import { JsonRpcSigner } from "ethers";
import { NFT_IMAGES_CORS_PROXY_URL } from "../../config/proxy.config";
import { EvmNft, SolanaNft, SuiNft } from "../../utils/types";
import { mapNftTokenTypeToContractStandard } from "./utils";

export function suiMapper(
    nfts: {
        name: string;
        url: string;
        description: string;
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
): SolanaNft[] {
    return nfts.map((item, i) => ({
        logoURI: item.logoURI,
        name: item.name,
        id: i,
        solanaAccount: item.accounts,
        network: ALLOWED_NETWORKS.Solana,
    }));
}
