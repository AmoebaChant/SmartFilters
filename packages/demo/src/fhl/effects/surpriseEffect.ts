import type { IEffect } from "./IEffect";
import type { ThinTexture } from "@babylonjs/core/Materials/Textures/thinTexture";
import type { ThinEngine } from "@babylonjs/core/Engines/thinEngine";
import { EffectBase } from "./effectBase";
import * as surpriseJSON from "./surprise.json";
import { SerializedSmartFilter } from "./serializedSmartFilter";

const FADE_IN_TIME = 400;
const EFFECT_DURATION = 2500;
const FADE_OUT_TIME = 400;

export class SurpriseEffect extends EffectBase implements IEffect {
    private _smartFilter: SerializedSmartFilter;

    protected override _effectName: string = "SurpriseEffect";

    public constructor(engine: ThinEngine, localDebugMode: boolean) {
        super();
        this._smartFilter = new SerializedSmartFilter(
            engine,
            localDebugMode,
            surpriseJSON,
            "videoFrame",
            "videoMask",
            "time1",
            "time2",
            "fade",
            "disabled"
        );

        // Register the smart filter with the global object so the editor browser extension can find it
        // NOTE: last one wins, so this should only be uncommented for one effect at a time for development
        (window as any).currentSmartFilter = this._smartFilter.smartFilter;
    }

    protected override _startInternal(): void {
        this._smartFilter.setInput("disabled", false);
        this._smartFilter.setInput("time1", 0);
        this._smartFilter.setInput("time2", 0);
        this._smartFilter.setInput("fade", 0);
    }

    protected override _timeAdvancedInternal(delta: number): void {
        this._smartFilter.getInput("time1").then((value) => {
            this._smartFilter.setInput("time1", (value as number) + 0.01 * delta);
        });
        this._smartFilter.getInput("time2").then((value) => {
            this._smartFilter.setInput("time2", (value as number) + 0.02 * delta);
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
