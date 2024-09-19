import type { IEffect } from "./IEffect";
import type { Nullable } from "@babylonjs/core/types";
import type { ThinTexture } from "@babylonjs/core/Materials/Textures/thinTexture";
import { LoveSmartFilter } from "./loveSmartFilter";
import type { ThinEngine } from "@babylonjs/core/Engines/thinEngine";
import { EffectBase } from "./effectBase";

export class LoveEffect extends EffectBase implements IEffect {
    private _smartFilter: LoveSmartFilter;
    private _endEffectTimeout: Nullable<NodeJS.Timeout> = null;

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

        this._endEffectTimeout = setTimeout(() => {
            console.log(`[${this._effectName}] End effect timer ticked`);
            this.stop(true);
        }, 2000);
    }

    protected override _timeAdvancedInternal(delta: number): void {
        this._smartFilter.time += 0.001 * delta;
    }

    protected override _stopInternal(): void {
        if (this._endEffectTimeout) {
            clearTimeout(this._endEffectTimeout);
            this._endEffectTimeout = null;
        }
        this._smartFilter.disabled = true;
    }

    public async initialize(inputTexture: ThinTexture): Promise<void> {
        this._smartFilterRuntime = await this._smartFilter.initRuntime(inputTexture);
    }
}
