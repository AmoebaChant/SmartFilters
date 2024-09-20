import type { IEffect } from "./IEffect";
import type { ThinTexture } from "@babylonjs/core/Materials/Textures/thinTexture";
import { LoveSmartFilter } from "./loveSmartFilter";
import type { ThinEngine } from "@babylonjs/core/Engines/thinEngine";
import { EffectBase } from "./effectBase";

const FADE_IN_TIME = 500;
const EFFECT_DURATION = 2500;
const FADE_OUT_TIME = 500;

export class LoveEffect extends EffectBase implements IEffect {
    private _smartFilter: LoveSmartFilter;
    protected override _effectName: string = "LoveEffect";

    public constructor(engine: ThinEngine, localDebugMode: boolean) {
        super();
        this._smartFilter = new LoveSmartFilter(engine, localDebugMode);

        // Register the smart filter with the global object so the editor browser extension can find it
        // NOTE: last one wins, so this should only be uncommented for one effect at a time for development
        (window as any).currentSmartFilter = this._smartFilter.smartFilter;
    }

    protected override _startInternal(): void {
        this._smartFilter.disabled = false;
        this._smartFilter.time = 0;
    }

    protected override _timeAdvancedInternal(delta: number): void {
        this._smartFilter.time += 0.001 * delta;

        if (this._totalTimeMs < FADE_IN_TIME) {
            this._smartFilter.fadeAmount = this._totalTimeMs / FADE_IN_TIME;
        } else if (this._totalTimeMs >= EFFECT_DURATION - FADE_OUT_TIME) {
            this._smartFilter.fadeAmount = 1 - (this._totalTimeMs - (EFFECT_DURATION - FADE_OUT_TIME)) / FADE_OUT_TIME;
        }

        if (this._totalTimeMs >= EFFECT_DURATION) {
            this.stop(true);
        }
    }

    protected override _stopInternal(): void {
        this._smartFilter.disabled = true;
    }

    public async initialize(inputTexture: ThinTexture): Promise<void> {
        this._smartFilterRuntime = await this._smartFilter.initRuntime(inputTexture);
    }
}
