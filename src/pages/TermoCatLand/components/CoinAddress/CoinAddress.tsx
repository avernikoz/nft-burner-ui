import { useEffect, useRef, useState } from "react";
import { styled } from "styled-components";
import { InputText } from "primereact/inputtext";

export const StyledInput = styled(InputText)`
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

export const CoinAddress = ({ address }: { address: string }) => {
    const [displayedAddress, setDisplayedAddress] = useState<string>(address);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const checkWidthAndAdjust = () => {
            const inputWidth = inputRef.current?.offsetWidth || 0;
            const fullAddress = address;
            const ellipsis = "…";

            const charWidth = 9.5;
            const fullAddressWidth = fullAddress.length * charWidth;

            if (fullAddressWidth > inputWidth) {
                const cutLength = (fullAddress.length - (fullAddressWidth - inputWidth) / charWidth) / 2 - 1;
                const firstPart = fullAddress.substring(0, cutLength);
                const lastPart = fullAddress.substring(fullAddress.length - cutLength);
                setDisplayedAddress(`${firstPart}${ellipsis}${lastPart}`);
            } else {
                setDisplayedAddress(fullAddress);
            }
        };

        checkWidthAndAdjust();
        window.addEventListener("resize", checkWidthAndAdjust);

        return () => {
            window.removeEventListener("resize", checkWidthAndAdjust);
        };
    }, [address]);

    return <StyledInput ref={inputRef} type="text" value={displayedAddress} readOnly />;
};
