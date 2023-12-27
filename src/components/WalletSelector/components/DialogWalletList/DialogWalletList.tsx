import React, { useState } from "react";

import { IMenuConnectionItem } from "../../types";
import { StyledTabMenu } from "./DialogWalletList.styled";

function DialogWalletList(props: { tabs: IMenuConnectionItem[]; activeTab: number }) {
    const [activeTabIndex, setTabActiveIndex] = useState<number>(props.activeTab);
    const { tabs } = props;

    return (
        <>
            <StyledTabMenu
                model={tabs}
                activeIndex={activeTabIndex}
                onTabChange={(e) => {
                    tabs[e.index].command?.({ originalEvent: e.originalEvent, item: e.value });
                    setTabActiveIndex(e.index);
                }}
            />
            <div>{tabs[activeTabIndex].list}</div>
        </>
    );
}

export default DialogWalletList;
