import type { IEffect } from "./IEffect";
import type { ThinTexture } from "@babylonjs/core/Materials/Textures/thinTexture";
import type { ThinEngine } from "@babylonjs/core/Engines/thinEngine";
import { EffectBase } from "./effectBase";
import * as applauseJSON from "./applause.json";
import { SerializedSmartFilter } from "./serializedSmartFilter";

const FADE_IN_TIME = 500;
const EFFECT_DURATION = 2500;
const FADE_OUT_TIME = 500;

export class ApplauseEffect extends EffectBase implements IEffect {
    private _smartFilter: SerializedSmartFilter;

    protected override _effectName: string = "ApplauseEffect";

    public constructor(engine: ThinEngine, localDebugMode: boolean) {
        super();
        this._smartFilter = new SerializedSmartFilter(
            engine,
            localDebugMode,
            applauseJSON,
            "videoFrame",
            "videoMask",
            "timeAurora",
            "timeFireworks",
            "fade",
            "disabled"
        );

        // Register the smart filter with the global object so the editor browser extension can find it
        // NOTE: last one wins, so this should only be uncommented for one effect at a time for development
        (window as any).currentSmartFilter = this._smartFilter.smartFilter;
    }

    protected override _startInternal(): void {
        this._smartFilter.setInput("disabled", false);
        this._smartFilter.setInput("fade", 0);
        this._smartFilter.setInput("timeAurora", 0);
        this._smartFilter.setInput("timeFireworks", 0);
    }

    protected override _timeAdvancedInternal(delta: number): void {
        // Time step
        this._smartFilter.getInput("timeAurora").then((value) => {
            this._smartFilter.setInput("timeAurora", (value as number) + 0.01 * delta);
        });
        this._smartFilter.getInput("timeFireworks").then((value) => {
            this._smartFilter.setInput("timeFireworks", (value as number) + 0.001 * delta);
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
