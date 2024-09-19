import { app, videoEffects } from "@microsoft/teams-js";
import { LOCAL_SMART_FILTER_EFFECT_ID, SMART_FILTER_EFFECT_ID, SmartFilterVideoApp } from "./fhl/smartFilterVideoApp";
// import { LocalTestWithWebcam } from "./fhl/localTestWithWebcam";
import type { Nullable } from "@babylonjs/core/types";

// Read page elements
const likeButton = document.getElementById("likeButton") as HTMLButtonElement;
const loveButton = document.getElementById("loveButton") as HTMLButtonElement;
const applauseButton = document.getElementById("applauseButton") as HTMLButtonElement;
const laughButton = document.getElementById("laughButton") as HTMLButtonElement;
const surprisedButton = document.getElementById("surprisedButton") as HTMLButtonElement;

const outputCanvas = document.getElementById("outputCanvas") as HTMLCanvasElement;

async function initializeSmartFilterApp(localDebugMode: boolean): Promise<SmartFilterVideoApp> {
    // Initialize the SmartFilter Video App
    console.log("Initializing SmartFilter Video App...");
    const videoApp = new SmartFilterVideoApp(outputCanvas, localDebugMode);

    console.log("Initializing SmartFilter Runtime...");
    await videoApp.initRuntimes();

    // Register button click handlers
    likeButton.addEventListener("click", () => {
        videoApp.startFilter("Like");
    });
    loveButton.addEventListener("click", () => {
        videoApp.startFilter("Love");
    });
    applauseButton.addEventListener("click", () => {
        videoApp.startFilter("Applause");
    });
    laughButton.addEventListener("click", () => {
        videoApp.startFilter("Laugh");
    });
    surprisedButton.addEventListener("click", () => {
        videoApp.startFilter("Surprised");
    });

    return videoApp;
}

// Local test in case we are not running in Teams
// let localTestWithWebcam: Nullable<LocalTestWithWebcam> = null;

/**
 * Main function to initialize the app.
 */
let videoApp: Nullable<SmartFilterVideoApp> = null;
async function main(): Promise<void> {
    try {
        console.log("Initializing Teams API...");
        await app.initialize();

        videoApp = await initializeSmartFilterApp(false);

        console.log("Registering for video effect selections...");
        videoEffects.registerForVideoEffect(videoApp.videoEffectSelected.bind(videoApp));

        console.log("Registering for video frame callbacks...");
        videoEffects.registerForVideoFrame({
            videoFrameHandler: videoApp.videoFrameHandler.bind(videoApp),
            /**
             * Callback function to process the video frames shared by the host.
             */
            videoBufferHandler: videoApp.videoBufferHandler.bind(videoApp),
            /**
             * Video frame configuration supplied to the host to customize the generated video frame parameters, like format
             */
            config: {
                format: videoEffects.VideoFrameFormat.NV12,
            },
        });

        // Tell Teams we want to show our effect
        videoEffects.notifySelectedVideoEffectChanged(
            videoEffects.EffectChangeType.EffectChanged,
            document.location.hostname.indexOf("localhost") !== -1
                ? LOCAL_SMART_FILTER_EFFECT_ID
                : SMART_FILTER_EFFECT_ID
        );
    } catch (e) {
        console.log("Not in Teams - running in debug mode");
        videoApp = await initializeSmartFilterApp(true);

        // localTestWithWebcam = new LocalTestWithWebcam();
        // await localTestWithWebcam.load();
        // localTestWithWebcam.onVideoFrameAvailable.add(async (videoFrame) => {
        //     const outputFrame = await videoApp.videoFrameHandler({ videoFrame });
        //     outputFrame.close();
        // });
        outputCanvas.style.display = "block";
    }
}

main().catch((e) => {
    console.error(e);
});
