import { Observable } from "@babylonjs/core/Misc/observable";
import { LocalStorageWebcamIdKey } from "../configuration/blocks/inputs/webCamInputBlock";

export class LocalTestWithWebcam {
    private _mediaStream: MediaStream | undefined;
    private _isDisposed = false;
    private _hiddenVideo: HTMLVideoElement | undefined;

    public onVideoFrameAvailable: Observable<VideoFrame> = new Observable<VideoFrame>();

    public async load(): Promise<void> {
        const width = 640;
        const height = 480;

        const mediaTrackConstraints: MediaTrackConstraints = {
            width,
            height,
        };
        const deviceId = localStorage.getItem(LocalStorageWebcamIdKey);
        if (deviceId !== null) {
            mediaTrackConstraints.deviceId = deviceId;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
            video: mediaTrackConstraints,
            audio: false,
        });
        this._mediaStream = stream;

        if (this._isDisposed) {
            this._disposeMediaStream();
            return;
        }

        const hiddenVideo = document.createElement("video");
        this._hiddenVideo = hiddenVideo;
        document.body.append(hiddenVideo);

        hiddenVideo.style.position = "absolute";
        hiddenVideo.style.top = "0";
        hiddenVideo.style.visibility = "hidden";

        hiddenVideo.setAttribute("playsinline", "");
        hiddenVideo.muted = true;
        hiddenVideo.autoplay = true;
        hiddenVideo.loop = true;
        hiddenVideo.width = width;
        hiddenVideo.height = height;

        hiddenVideo.onerror = () => {
            throw "Failed to load WebCam";
        };

        hiddenVideo.onloadeddata = () => {
            const update = () => {
                if (this._isDisposed) {
                    return;
                }

                if (hiddenVideo.readyState >= hiddenVideo.HAVE_CURRENT_DATA) {
                    const videoFrame = new VideoFrame(hiddenVideo, { timestamp: hiddenVideo.currentTime });
                    this.onVideoFrameAvailable.notifyObservers(videoFrame);
                    videoFrame.close();
                }

                hiddenVideo.requestVideoFrameCallback(update);
            };

            hiddenVideo.requestVideoFrameCallback(update);
        };

        hiddenVideo.srcObject = stream;
    }

    public dispose(): void {
        this._isDisposed = true;

        this._disposeMediaStream();
        if (this._hiddenVideo) {
            this._hiddenVideo.onloadeddata = null;
            this._hiddenVideo.pause();
            this._hiddenVideo.srcObject = null;
            document.body.removeChild(this._hiddenVideo);
            this._hiddenVideo = undefined;
        }
    }

    private _disposeMediaStream(): void {
        if (this._mediaStream) {
            this._mediaStream.getTracks().forEach((track) => track.stop());
            this._mediaStream = undefined;
        }
    }
}
