import type { IEffect } from "./IEffect";
import type { ThinTexture } from "@babylonjs/core/Materials/Textures/thinTexture";
import type { ThinEngine } from "@babylonjs/core/Engines/thinEngine";
import { EffectBase } from "./effectBase";
import { SerializedSmartFilter } from "./serializedSmartFilter";
import * as likeJSON from "./like.json";

const FADE_IN_TIME = 200;
const EFFECT_DURATION = 1500;
const FADE_OUT_TIME = 200;

export class LikeEffect extends EffectBase implements IEffect {
    private _smartFilter: SerializedSmartFilter;

    protected override _effectName: string = "LikeEffect";

    public constructor(engine: ThinEngine, localDebugMode: boolean) {
        super();
        this._smartFilter = new SerializedSmartFilter(
            engine,
            localDebugMode,
            likeJSON,
            "videoFrame",
            "videoMask",
            "time",
            "fade",
            "disabled"
        );

        // Register the smart filter with the global object so the editor browser extension can find it
        // NOTE: last one wins, so this should only be uncommented for one effect at a time for development
        (window as any).currentSmartFilter = this._smartFilter.smartFilter;
    }

    protected override _startInternal(): void {
        this._smartFilter.setInput("disabled", false);
        this._smartFilter.setInput("time", 0);
        this._smartFilter.setInput("fade", 0);
    }

    protected override _timeAdvancedInternal(delta: number): void {
        this._smartFilter.getInput("time").then((value) => {
            this._smartFilter.setInput("time", (value as number) + 0.005 * delta);
        });

        // Fade in/out
        if (this._totalTimeMs < FADE_IN_TIME) {
            this._smartFilter.setInput("fade", this._totalTimeMs / FADE_IN_TIME);
        } else if (this._totalTimeMs >= EFFECT_DURATION - FADE_OUT_TIME) {
            this._smartFilter.setInput(
                "fade",
                1 - (this._totalTimeMs - (EFFECT_DURATION - FADE_OUT_TIME)) / FADE_OUT_TIME
            );
        }

        if (this._totalTimeMs >= EFFECT_DURATION) {
            this.stop(true);
        }
    }

    protected override _stopInternal(): void {
        this._smartFilter.setInput("disabled", true);
    }

    public async initialize(inputTexture: ThinTexture): Promise<void> {
        this._smartFilterRuntime = await this._smartFilter.initRuntime(inputTexture);
    }
}
