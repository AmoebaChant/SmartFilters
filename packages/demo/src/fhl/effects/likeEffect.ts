import { Observable } from "@babylonjs/core/Misc/observable";
import type { IEffect } from "./IEffect";
import type { ThinTexture } from "@babylonjs/core/Materials/Textures/thinTexture";
import type { ThinEngine } from "@babylonjs/core/Engines/thinEngine";
import { EffectBase } from "./effectBase";
import type { Nullable } from "@babylonjs/core/types";
import { LikeSmartFilter } from "./likeSmartFilter";

export class LikeEffect extends EffectBase implements IEffect {
    private _smartFilter: LikeSmartFilter;
    private _endEffectTimeout: Nullable<NodeJS.Timeout> = null;

    protected override _effectName: string = "LikeEffect";

    public constructor(engine: ThinEngine, localDebugMode: boolean) {
        super();
        this._smartFilter = new LikeSmartFilter(engine, localDebugMode);
        this.onEffectCompleted = new Observable<void>();

        // Register the smart filter with the global object so the editor browser extension can find it
        // NOTE: last one wins, so this should only be uncommented for one effect at a time for development
        (window as any).currentSmartFilter = this._smartFilter.smartFilter;
    }

    protected override _startInternal(): void {
        this._smartFilter.disabled = false;
        this._endEffectTimeout = setTimeout(() => {
            console.log(`[${this._effectName}] End effect timer ticked`);
            this.stop(true);
        }, 2000);
    }

    protected override _timeAdvancedInternal(_delta: number): void {
        // Nothing to do
    }

    protected override _stopInternal(): void {
        this._smartFilter.disabled = true;
        if (this._endEffectTimeout) {
            clearTimeout(this._endEffectTimeout);
            this._endEffectTimeout = null;
        }
    }

    public async initialize(inputTexture: ThinTexture): Promise<void> {
        this._smartFilterRuntime = await this._smartFilter.initRuntime(inputTexture);
    }
}
