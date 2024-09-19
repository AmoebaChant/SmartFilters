import {
    type ConnectionPoint,
    ConnectionPointType,
    createStrongRef,
    InputBlock,
    type SmartFilter,
} from "@babylonjs/smart-filters";
import { CompositionBlock } from "../../configuration/blocks/effects/compositionBlock";

export type SplitInputTextureType = {
    videoTextureConnectionPoint: ConnectionPoint<ConnectionPointType.Texture>;
    maskTextureConnectionPoint: ConnectionPoint<ConnectionPointType.Texture>;
};

export function splitInputTexture(
    smartFilter: SmartFilter,
    textureInputBlock: InputBlock<ConnectionPointType.Texture>
): SplitInputTextureType {
    // Composition to extract person frame from input
    const videoCompositionBlock = new CompositionBlock(smartFilter, "videoExtractor");
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
    const maskCompositionBlock = new CompositionBlock(smartFilter, "maskExtractor");
    textureInputBlock.output.connectTo(maskCompositionBlock.background);
    textureInputBlock.output.connectTo(maskCompositionBlock.foreground);
    twoFloatInputBlock.output.connectTo(maskCompositionBlock.foregroundHeight);

    return {
        videoTextureConnectionPoint: videoCompositionBlock.output,
        maskTextureConnectionPoint: maskCompositionBlock.output,
    };
}
