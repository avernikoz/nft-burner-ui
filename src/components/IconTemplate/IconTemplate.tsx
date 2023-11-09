import React from "react";

const IconTemplate = ({ svgString }: { svgString: string }) => {
    return <img src={svgString} alt="" width={30} height={30} />;
};

export default IconTemplate;
