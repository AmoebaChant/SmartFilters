import { Observable } from "@babylonjs/core/Misc/observable";
import type { ReactionsSmartFilter } from "../reactionsSmartFilter";
import type { IEffect } from "./IEffect";
import type { Nullable } from "@babylonjs/core/types";

export class LoveEffect implements IEffect {
    private _isStarted = false;
    private _smartFilter: ReactionsSmartFilter;

    public onEffectCompleted: Observable<void>;
    private _endEffectTimeout: Nullable<NodeJS.Timeout> = null;
    private _updateTimeInterval: Nullable<NodeJS.Timeout> = null;

    public get isStarted(): boolean {
        return this._isStarted;
    }

    public constructor(smartFilter: ReactionsSmartFilter) {
        this._smartFilter = smartFilter;
        this.onEffectCompleted = new Observable<void>();
    }

    public start(): void {
        if (this._isStarted) {
            return;
        }
        this._isStarted = true;

        console.log("[LoveEffect] Starting");
        this._smartFilter.loveEffectDisabled = false;

        let lastTimeCalled = performance.now();
        let now = performance.now();
        let delta = 0;

        this._updateTimeInterval = setInterval(() => {
            now = performance.now();
            delta = now - lastTimeCalled;
            lastTimeCalled = now;
            this._smartFilter.time += 0.001 * delta;
        }, 1);

        this._endEffectTimeout = setTimeout(() => {
            console.log("[LoveEffect] Timer ticked");
            this.stop(true);
        }, 2000);
    }

    public stop(notifyEffectCompleted: boolean): void {
        if (!this._isStarted) {
            return;
        }
        console.log("[LoveEffect] Stopping");
        this._isStarted = false;

        if (this._updateTimeInterval) {
            clearInterval(this._updateTimeInterval);
            this._updateTimeInterval = null;
        }
        if (this._endEffectTimeout) {
            clearTimeout(this._endEffectTimeout);
            this._endEffectTimeout = null;
        }
        this._smartFilter.loveEffectDisabled = true;

        if (notifyEffectCompleted) {
            this.onEffectCompleted.notifyObservers();
        }
    }
}
