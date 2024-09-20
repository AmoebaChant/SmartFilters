import { Observable } from "@babylonjs/core/Misc/observable";
import type { Nullable } from "@babylonjs/core/types";
import type { SmartFilterRuntime } from "@babylonjs/smart-filters";

export abstract class EffectBase {
    private _updateTimeInterval: Nullable<NodeJS.Timeout> = null;

    protected _isStarted = false;
    protected _smartFilterRuntime: Nullable<SmartFilterRuntime> = null;
    protected abstract _effectName: string;

    /**
     * The total time the effect has been running in milliseconds
     */
    protected _totalTimeMs = 0;

    private _animationStartTime = 0;

    public onEffectCompleted: Observable<void> = new Observable<void>();

    public get isStarted(): boolean {
        return this._isStarted;
    }

    public get name(): string {
        return this._effectName;
    }

    public start(): void {
        if (this._isStarted) {
            return;
        }
        this._isStarted = true;
        this._totalTimeMs = 0;
        this._animationStartTime = performance.now();

        console.log(`[${this._effectName}] Starting`);

        let lastTimeUpdate = performance.now();
        let now = performance.now();
        let deltaSinceLastUpdate = 0;

        this._updateTimeInterval = setInterval(() => {
            now = performance.now();
            this._totalTimeMs = now - this._animationStartTime;
            deltaSinceLastUpdate = now - lastTimeUpdate;
            lastTimeUpdate = now;
            this._timeAdvancedInternal(deltaSinceLastUpdate);
        }, 16);

        this._startInternal();
    }

    public renderFrame(): void {
        if (!this._isStarted) {
            return;
        }
        if (this._smartFilterRuntime) {
            this._smartFilterRuntime.render();
        }
    }

    public stop(notifyEffectCompleted: boolean): void {
        if (!this._isStarted) {
            return;
        }
        console.log(`[${this._effectName}] Stopping`);
        this._isStarted = false;

        if (this._updateTimeInterval) {
            clearInterval(this._updateTimeInterval);
            this._updateTimeInterval = null;
        }

        this._stopInternal();

        if (notifyEffectCompleted) {
            this.onEffectCompleted.notifyObservers();
        }
    }

    protected abstract _startInternal(): void;
    protected abstract _timeAdvancedInternal(_timeSinceLastUpdateMs: number): void;
    protected abstract _stopInternal(): void;
}
