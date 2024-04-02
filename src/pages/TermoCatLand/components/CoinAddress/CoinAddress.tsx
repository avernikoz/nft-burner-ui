import { useCallback, useEffect, useRef, useState } from "react";
import { styled } from "styled-components";
import { InputText } from "primereact/inputtext";

const StyledInput = styled(InputText)`
    border: 2px solid #fff;
    width: 45%;
    border-radius: 0;
    background-color: transparent;
    color: #fff;
    margin-bottom: 1rem;
    text-overflow: ellipsis;
    white-space: nowrap;

    @media screen and (max-width: 1000px) {
        font-size: 0.8rem;
        width: 100%;
    }
`;

const CoinAddress = ({ address }: { address: string }) => {
    const [displayedAddress, setDisplayedAddress] = useState<string>(address);
    const inputRef = useRef<HTMLInputElement>(null);

    const checkWidthAndAdjust = useCallback(() => {
        const inputWidth = inputRef.current?.offsetWidth || 0;
        const fullAddress = address;
        const ellipsis = "…";

        const charWidth = 9.5;
        const fullAddressWidth = fullAddress.length * charWidth;

        if (fullAddressWidth > inputWidth) {
            const cutLength = Math.floor((fullAddress.length - (fullAddressWidth - inputWidth) / charWidth) / 2) - 1;
            const firstPart = fullAddress.substring(0, cutLength);
            const lastPart = fullAddress.substring(fullAddress.length - cutLength);
            setDisplayedAddress(`${firstPart}${ellipsis}${lastPart}`);
        } else {
            setDisplayedAddress(fullAddress);
        }
    }, [address]); // Specify address as a dependency

    useEffect(() => {
        if (address.length > 0) {
            checkWidthAndAdjust();
        }
    }, [address.length, checkWidthAndAdjust]); // Dependency on checkWidthAndAdjust ensures it runs when address changes

    return <StyledInput ref={inputRef} type="text" value={displayedAddress} readOnly />;
};

export default CoinAddress;
