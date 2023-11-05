import React from 'react';

const SVGTemplate = ({ svgString }: {svgString:string}) => {
    const svgData  = atob(svgString.slice(26)); // Remove "data:image/svg+xml;base64," and decode base64 data
   const modifiedSvgData = svgData.replace(/width=".*?"/, `width="30"`);
    const secSvgDate = modifiedSvgData.replace(/height=".*?"/, `height="30"`);

    const finalSvgData = secSvgDate.replace(/xmlns=".*?"/, `width="30" height="30" xmlns="http://www.w3.org/2000/svg"`);


    return (
        <i

            dangerouslySetInnerHTML={{ __html: finalSvgData }}
        />
    );
};

export default SVGTemplate;
