import React, { useState } from "react";
import { TabMenu } from "primereact/tabmenu";

import { IMenuConnectionItem } from "../../types";

function DialogWalletList(props: { tabs: IMenuConnectionItem[]; activeTab: number }) {
    const [activeTabIndex, setTabActiveIndex] = useState<number>(props.activeTab);
    const { tabs } = props;

    return (
        <>
            <TabMenu
                model={tabs}
                activeIndex={activeTabIndex}
                style={{ width: "90%", margin: "0 auto" }}
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
