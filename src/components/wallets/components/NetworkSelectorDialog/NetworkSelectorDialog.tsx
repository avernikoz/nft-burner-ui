import { useEffect } from "react";
import { NftBurnDialogContainer, StyledDialog } from "../../../Control/components/NftBurnDialog/NftBurnDialog.styled";
import { IMenuConnectionItem } from "../../types";
import DialogWalletList from "../DialogWalletList/DialogWalletList";
import { DialogWalletListContainer } from "./NetworkSelectorDialog.styled";

export const NftSelectorDialog = ({
    visible,
    setVisible,
    tabItems,
    activeIndex,
}: {
    visible: boolean;
    setVisible: () => void;
    tabItems: React.MutableRefObject<IMenuConnectionItem[]>;
    activeIndex: number;
}) => {
    // Blur on opened popup
    useEffect(() => {
        if (visible) {
            document.body.classList.add("blur-background");
        } else {
            document.body.classList.remove("blur-background");
        }

        return () => {
            document.body.classList.remove("blur-background");
        };
    }, [visible]);

    return (
        <StyledDialog
            header="Choose your wallet"
            visible={visible}
            style={{ width: "min-content" }}
            onHide={() => setVisible()}
            draggable={false}
            resizable={false}
        >
            <NftBurnDialogContainer style={{ minWidth: "auto" }}>
                <DialogWalletListContainer>
                    <DialogWalletList
                        tabs={tabItems.current}
                        // TODO: Replace with more descriptive condition
                        activeTab={activeIndex < 4 ? 0 : activeIndex - 3}
                    ></DialogWalletList>
                </DialogWalletListContainer>
            </NftBurnDialogContainer>
        </StyledDialog>
    );
};
