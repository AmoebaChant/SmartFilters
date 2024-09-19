import { Observable } from "@babylonjs/core/Misc/observable";
import type { IEffect } from "./IEffect";
import type { ThinTexture } from "@babylonjs/core/Materials/Textures/thinTexture";
import type { ThinEngine } from "@babylonjs/core/Engines/thinEngine";
import { EffectBase } from "./effectBase";
import { NullSmartFilter } from "./nullSmartFilter";

export class NullEffect extends EffectBase implements IEffect {
    private _smartFilter: NullSmartFilter;

    protected override _effectName: string = "NullEffect";

    public constructor(engine: ThinEngine, localDebugMode: boolean) {
        super();
        this._smartFilter = new NullSmartFilter(engine, localDebugMode);
        this.onEffectCompleted = new Observable<void>();

        // Register the smart filter with the global object so the editor browser extension can find it
        // NOTE: last one wins, so this should only be uncommented for one effect at a time for development
        (window as any).currentSmartFilter = this._smartFilter.smartFilter;
    }

    protected override _startInternal(): void {}

    protected override _timeAdvancedInternal(_delta: number): void {
        // Nothing to do
    }

    protected override _stopInternal(): void {}

    public async initialize(inputTexture: ThinTexture): Promise<void> {
        this._smartFilterRuntime = await this._smartFilter.initRuntime(inputTexture);
    }
}
