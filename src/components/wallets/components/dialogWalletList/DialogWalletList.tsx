import React, { useEffect, useState } from "react";
import { TabMenu } from "primereact/tabmenu";

import { IMenuConnectionItem } from "../../Wallets";

function DialogWalletList(props: { tabs: IMenuConnectionItem[] }) {
    const [tabs, setTabs] = useState<IMenuConnectionItem[]>(props.tabs);
    const [activeTabIndex, setTabActiveIndex] = useState(0);
    console.log(props.tabs);

    useEffect(() => {
        setTabs(props.tabs);
    }, [props]);

    return (
        <>
            <TabMenu
                model={tabs}
                activeIndex={activeTabIndex}
                style={{ width: "90%", margin: "0 auto" }}
                onTabChange={(e) => {
                    if (tabs[e.index].command) {
                        tabs[e.index].command?.({ originalEvent: e.originalEvent, item: e.value });
                    }
                    setTabActiveIndex(e.index);
                }}
            />
            <div>{tabs[activeTabIndex].list}</div>
        </>
    );
}

export default DialogWalletList;
