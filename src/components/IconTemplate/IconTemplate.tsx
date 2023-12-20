import React from "react";

const IconTemplate = ({ svgString }: { svgString: string }) => {
    return <img src={svgString} alt="" width={24} height={24} />;
};

export default IconTemplate;
