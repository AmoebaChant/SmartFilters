import {
    type ConnectionPoint,
    ConnectionPointType,
    createStrongRef,
    InputBlock,
    type SmartFilter,
} from "@babylonjs/smart-filters";
import { CompositionBlock } from "../../configuration/blocks/effects/compositionBlock";

const VIDEO_EXTRACTOR = "videoExtractor";
const MASK_EXTRACTOR = "maskExtractor";

export type SplitInputTextureType = {
    videoTextureConnectionPoint: ConnectionPoint<ConnectionPointType.Texture>;
    maskTextureConnectionPoint: ConnectionPoint<ConnectionPointType.Texture>;
};

export function splitInputTexture(
    smartFilter: SmartFilter,
    textureInputBlock: InputBlock<ConnectionPointType.Texture>
): SplitInputTextureType {
    // Composition to extract person frame from input
    const videoCompositionBlock = new CompositionBlock(smartFilter, VIDEO_EXTRACTOR);
    const halfFloatInputBlock = new InputBlock<ConnectionPointType.Float>(
        smartFilter,
        "halfFloat",
        ConnectionPointType.Float,
        createStrongRef(0.5)
    );
    const twoFloatInputBlock = new InputBlock<ConnectionPointType.Float>(
        smartFilter,
        "twoFloat",
        ConnectionPointType.Float,
        createStrongRef(2.0)
    );
    textureInputBlock.output.connectTo(videoCompositionBlock.background);
    textureInputBlock.output.connectTo(videoCompositionBlock.foreground);
    halfFloatInputBlock.output.connectTo(videoCompositionBlock.foregroundTop);
    twoFloatInputBlock.output.connectTo(videoCompositionBlock.foregroundHeight);

    // Composition to extract mask frame from input
    const maskCompositionBlock = new CompositionBlock(smartFilter, MASK_EXTRACTOR);
    textureInputBlock.output.connectTo(maskCompositionBlock.background);
    textureInputBlock.output.connectTo(maskCompositionBlock.foreground);
    twoFloatInputBlock.output.connectTo(maskCompositionBlock.foregroundHeight);

    return {
        videoTextureConnectionPoint: videoCompositionBlock.output,
        maskTextureConnectionPoint: maskCompositionBlock.output,
    };
}

export function splitAndRewireInputTextures(
    smartFilter: SmartFilter,
    textureInputBlock: InputBlock<ConnectionPointType.Texture>,
    maskInputBlock?: InputBlock<ConnectionPointType.Texture>
): void {
    const { videoTextureConnectionPoint, maskTextureConnectionPoint } = splitInputTexture(
        smartFilter,
        textureInputBlock
    );

    // Replace wiring of old textures with new textures
    textureInputBlock.output.endpoints.forEach((endpoint) => {
        // Don't rewire its newly made composition block
        if (endpoint.ownerBlock.name != VIDEO_EXTRACTOR && endpoint.ownerBlock.name != MASK_EXTRACTOR) {
            videoTextureConnectionPoint.connectTo(endpoint as ConnectionPoint<ConnectionPointType.Texture>);
        }
    });
    maskInputBlock?.output.endpoints.forEach((endpoint) => {
        maskTextureConnectionPoint.connectTo(endpoint as ConnectionPoint<ConnectionPointType.Texture>);
    });
}
