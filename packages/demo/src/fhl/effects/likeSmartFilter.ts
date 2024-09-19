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
import { BlackAndWhiteBlock } from "../../configuration/blocks/effects/blackAndWhiteBlock";

export class LikeSmartFilter {
    private _disableInputBlock: InputBlock<ConnectionPointType.Boolean>;
    private _engine: ThinEngine;
    private _localDebugMode: boolean = false;

    public smartFilter: SmartFilter;
    public textureInputBlock: InputBlock<ConnectionPointType.Texture>;

    public get disabled(): boolean {
        return this._disableInputBlock.runtimeValue.value;
    }
    public set disabled(value: boolean) {
        this._disableInputBlock.runtimeValue.value = value;
    }

    constructor(engine: ThinEngine, localDebugMode: boolean) {
        this._engine = engine;
        this._localDebugMode = localDebugMode;

        this.smartFilter = new SmartFilter("Like");

        this.textureInputBlock = new InputBlock<ConnectionPointType.Texture>(
            this.smartFilter,
            "videoFrame",
            ConnectionPointType.Texture,
            createStrongRef(null)
        );

        // Black and white block
        const blackAndWhiteBlock = new BlackAndWhiteBlock(this.smartFilter, "blackAndWhite");
        this._disableInputBlock = new InputBlock<ConnectionPointType.Boolean>(
            this.smartFilter,
            "disable",
            ConnectionPointType.Boolean,
            createStrongRef(true)
        );
        this._disableInputBlock.output.connectTo(blackAndWhiteBlock.disabled);
        this.textureInputBlock.output.connectTo(blackAndWhiteBlock.input);
        blackAndWhiteBlock.output.connectTo(this.smartFilter.output);
    }

    public async initRuntime(inputTexture: ThinTexture): Promise<SmartFilterRuntime> {
        const smartFilterRuntime = await this.smartFilter.createRuntimeAsync(this._engine);

        if (this._localDebugMode) {
            inputTexture = createImageTexture(this._engine, "assets/kevinWithGreenScreen.png");
        }

        this.textureInputBlock.runtimeValue.value = inputTexture;

        return smartFilterRuntime;
    }
}
