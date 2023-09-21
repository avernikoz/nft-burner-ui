export const getMediaRecorder = (canvas: HTMLCanvasElement) => {
    const videoStream = canvas.captureStream(30);
    const mediaRecorder = new MediaRecorder(videoStream);

    let chunks: BlobEvent["data"][] = [];
    mediaRecorder.ondataavailable = function (e: BlobEvent) {
        chunks.push(e.data);
    };

    mediaRecorder.onstop = function (e) {
        const blob = new Blob(chunks, { type: "video/mp4" });
        chunks = [];
        // TODO: Store or it on client side or either server it off-chain
    };

    mediaRecorder.ondataavailable = function (e) {
        chunks.push(e.data);
    };

    return mediaRecorder;
};
