import type { SmartFilterRuntime } from "@babylonjs/smart-filters";
import {
    ConnectionPointType,
    createImageTexture,
    createStrongRef,
    InputBlock,
    SmartFilter,
} from "@babylonjs/smart-filters";
import type { ThinEngine } from "@babylonjs/core/Engines/thinEngine";
import type { ThinTexture } from "@babylonjs/core/Materials/Textures/thinTexture";
import { CompositionBlock } from "../../configuration/blocks/effects/compositionBlock";

/**
 * It returns the top half of the input texture, to account for the way the segmentation frame is at the bottom of the input texture.
 */
export class NullSmartFilter {
    private _engine: ThinEngine;
    private _localDebugMode: boolean = false;

    public smartFilter: SmartFilter;
    public textureInputBlock: InputBlock<ConnectionPointType.Texture>;

    constructor(engine: ThinEngine, localDebugMode: boolean) {
        this._engine = engine;
        this._localDebugMode = localDebugMode;

        this.smartFilter = new SmartFilter("Love");

        this.textureInputBlock = new InputBlock<ConnectionPointType.Texture>(
            this.smartFilter,
            "videoFrameWithSegment",
            ConnectionPointType.Texture,
            createStrongRef(null)
        );

        // Composition to extract person frame from input
        const personCompositionBlock = new CompositionBlock(this.smartFilter, "personComposition");
        const halfFloatInputBlock = new InputBlock<ConnectionPointType.Float>(
            this.smartFilter,
            "halfFloat",
            ConnectionPointType.Float,
            createStrongRef(0.5)
        );
        const twoFloatInputBlock = new InputBlock<ConnectionPointType.Float>(
            this.smartFilter,
            "twoFloat",
            ConnectionPointType.Float,
            createStrongRef(2.0)
        );
        this.textureInputBlock.output.connectTo(personCompositionBlock.background);
        this.textureInputBlock.output.connectTo(personCompositionBlock.foreground);
        halfFloatInputBlock.output.connectTo(personCompositionBlock.foregroundTop);
        twoFloatInputBlock.output.connectTo(personCompositionBlock.foregroundHeight);

        personCompositionBlock.output.connectTo(this.smartFilter.output);
    }

    public async initRuntime(inputTexture: ThinTexture): Promise<SmartFilterRuntime> {
        const smartFilterRuntime = await this.smartFilter.createRuntimeAsync(this._engine);

        if (this._localDebugMode) {
            inputTexture = createImageTexture(this._engine, "assets/stackedImageAndMask.png");
        }

        this.textureInputBlock.runtimeValue.value = inputTexture;

        return smartFilterRuntime;
    }
}
