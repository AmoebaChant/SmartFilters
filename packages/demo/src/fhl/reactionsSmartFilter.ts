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
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { HeartsBlock } from "../configuration/blocks/generators/heartsBlock";
import { CompositionBlock } from "../configuration/blocks/effects/compositionBlock";
import { NeonHeartBlock } from "../configuration/blocks/generators/neonHeartBlock";
import { GreenScreenMaskBlock } from "../configuration/blocks/effects/greenScreenMaskBlock";
import { TintBlock } from "../configuration/blocks/effects/tintBlock";

export class ReactionsSmartFilter {
    private _masterDisableInputBlock: InputBlock<ConnectionPointType.Boolean>;
    private _engine: ThinEngine;
    private _timeInputBlock: InputBlock<ConnectionPointType.Float>;

    public smartFilter: SmartFilter;
    public textureInputBlock: InputBlock<ConnectionPointType.Texture>;

    public get time(): number {
        return this._timeInputBlock.runtimeValue.value;
    }
    public set time(value: number) {
        this._timeInputBlock.runtimeValue.value = value;
    }
    public get loveEffectDisabled(): boolean {
        return this._masterDisableInputBlock.runtimeValue.value;
    }
    public set loveEffectDisabled(value: boolean) {
        this._masterDisableInputBlock.runtimeValue.value = value;
    }

    constructor(engine: ThinEngine) {
        this._engine = engine;

        this.smartFilter = new SmartFilter("Love");

        this.textureInputBlock = new InputBlock<ConnectionPointType.Texture>(
            this.smartFilter,
            "videoFrame",
            ConnectionPointType.Texture,
            createStrongRef(null)
        );

        this._masterDisableInputBlock = new InputBlock<ConnectionPointType.Boolean>(
            this.smartFilter,
            "masterDisable",
            ConnectionPointType.Boolean,
            createStrongRef(true)
        );

        // Green Screen Mask for the input texture
        const greenScreenMaskBlock = new GreenScreenMaskBlock(this.smartFilter, "greenScreenMask");
        const greenScreenMaskColorInput = new InputBlock<ConnectionPointType.Color3>(
            this.smartFilter,
            "greenScreenColor",
            ConnectionPointType.Color3,
            createStrongRef({ r: 92 / 255, g: 204 / 255, b: 78 / 255 })
        );
        const greenScreenDistanceInput = new InputBlock<ConnectionPointType.Float>(
            this.smartFilter,
            "greenScreenDistance",
            ConnectionPointType.Float,
            createStrongRef(0.1)
        );
        this.textureInputBlock.output.connectTo(greenScreenMaskBlock.input);
        greenScreenMaskColorInput.output.connectTo(greenScreenMaskBlock.reference);
        greenScreenDistanceInput.output.connectTo(greenScreenMaskBlock.distance);

        // Tint block
        const tintBlock = new TintBlock(this.smartFilter, "tint");
        const tintColorInput = new InputBlock<ConnectionPointType.Color3>(
            this.smartFilter,
            "tintColor",
            ConnectionPointType.Color3,
            createStrongRef(new Color3(88 / 255, 10 / 255, 79 / 255))
        );
        const tintColorAmountInput = new InputBlock<ConnectionPointType.Float>(
            this.smartFilter,
            "tintColorAmount",
            ConnectionPointType.Float,
            createStrongRef(0.26)
        );
        greenScreenMaskBlock.output.connectTo(tintBlock.input);
        tintColorInput.output.connectTo(tintBlock.tint);
        tintColorAmountInput.output.connectTo(tintBlock.amount);

        // Hearts block
        const heartsBlock = new HeartsBlock(this.smartFilter, "hearts");
        const heartsInput = new InputBlock<ConnectionPointType.Texture>(
            this.smartFilter,
            "heartsTexture",
            ConnectionPointType.Texture,
            createStrongRef(createImageTexture(this._engine, "assets/kittens.jpg"))
        );
        this._timeInputBlock = new InputBlock<ConnectionPointType.Float>(
            this.smartFilter,
            "time",
            ConnectionPointType.Float,
            createStrongRef(0)
        );
        this._masterDisableInputBlock.output.connectTo(heartsBlock.disabled);
        //this.textureInputBlock.output.connectTo(heartsBlock.input);
        heartsInput.output.connectTo(heartsBlock.input);
        this._timeInputBlock.output.connectTo(heartsBlock.time);
        tintColorInput.output.connectTo(heartsBlock.tint);

        // Composition block
        const compositionBlock = new CompositionBlock(this.smartFilter, "composition");
        this._masterDisableInputBlock.output.connectTo(compositionBlock.disabled);
        tintBlock.output.connectTo(compositionBlock.foreground);
        heartsBlock.output.connectTo(compositionBlock.background);

        // Neon heart block
        const neonHeartBlock = new NeonHeartBlock(this.smartFilter, "neonHeart");
        const neonHeartColor1Input = new InputBlock<ConnectionPointType.Color3>(
            this.smartFilter,
            "neonHeartColor1",
            ConnectionPointType.Color3,
            createStrongRef(new Color3(13 / 255, 214 / 255, 55 / 255))
        );
        const neonHeartColor2Input = new InputBlock<ConnectionPointType.Color3>(
            this.smartFilter,
            "neonHeartColor2",
            ConnectionPointType.Color3,
            createStrongRef(new Color3(16 / 255, 172 / 255, 216 / 255))
        );
        this._masterDisableInputBlock.output.connectTo(neonHeartBlock.disabled);
        compositionBlock.output.connectTo(neonHeartBlock.input);
        this._timeInputBlock.output.connectTo(neonHeartBlock.time);
        neonHeartColor1Input.output.connectTo(neonHeartBlock.color1);
        neonHeartColor2Input.output.connectTo(neonHeartBlock.color2);

        // Output
        neonHeartBlock.output.connectTo(this.smartFilter.output);
    }

    public async initRuntime(inputTexture: ThinTexture): Promise<SmartFilterRuntime> {
        const smartFilterRuntime = await this.smartFilter.createRuntimeAsync(this._engine);

        // inputTexture = createImageTexture(this._engine, "assets/kevinWithGreenScreen.png");

        this.textureInputBlock.runtimeValue.value = inputTexture;

        return smartFilterRuntime;
    }
}
