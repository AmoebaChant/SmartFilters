import type { videoEffects } from "@microsoft/teams-js";
import { ThinEngine } from "@babylonjs/core/Engines/thinEngine";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import type { Nullable } from "@babylonjs/core/types";
import { ThinTexture } from "@babylonjs/core/Materials/Textures/thinTexture";
import "@babylonjs/core/Engines/Extensions/engine.dynamicTexture";
import type { InternalTexture } from "@babylonjs/core/Materials/Textures/internalTexture";
import type { IEffect } from "./effects/IEffect";
import { LoveEffect } from "./effects/loveEffect";
import { LikeEffect } from "./effects/likeEffect";
import type { Observer } from "@babylonjs/core/Misc/observable";
import { NullEffect } from "./effects/nullEffect";

export const SMART_FILTER_EFFECT_ID = "f71bd30b-c5e9-48ff-b039-42bc19df95a8";
export const LOCAL_SMART_FILTER_EFFECT_ID = "fb9f0fab-9eb9-4756-8588-8dc3c6ad04d0";

export type SmartFilterEffect = "Like" | "Love" | "Applause" | "Laugh" | "Surprised";

export class SmartFilterVideoApp {
    private _outputCanvas: HTMLCanvasElement;
    private _localDebugMode: boolean;

    private _engine: ThinEngine;
    private _internalInputTexture: InternalTexture;
    private _inputTexture: ThinTexture;
    private _effects: Map<SmartFilterEffect, IEffect> = new Map<SmartFilterEffect, IEffect>();
    private _nullEffect: NullEffect;
    private _currentEffect: IEffect;
    private _currentEffectCompletedObserver: Nullable<Observer<void>> = null;

    constructor(outputCanvas: HTMLCanvasElement, localDebugMode: boolean) {
        this._outputCanvas = outputCanvas;
        this._localDebugMode = localDebugMode;

        this._engine = new ThinEngine(this._outputCanvas);
        (window as any).thinEngine = this._engine;

        // Create Dynamic Texture
        this._internalInputTexture = this._engine.createDynamicTexture(
            this._outputCanvas.width,
            this._outputCanvas.height,
            false,
            Texture.BILINEAR_SAMPLINGMODE
        );
        this._inputTexture = new ThinTexture(this._internalInputTexture);

        // Register effects
        this._effects.set("Like", new LikeEffect(this._engine, localDebugMode));
        this._effects.set("Love", new LoveEffect(this._engine, localDebugMode));
        this._nullEffect = new NullEffect(this._engine, localDebugMode);
        this._currentEffect = this._nullEffect;
        this._nullEffect.start();
    }

    public async initRuntimes(): Promise<void> {
        const initPromises: Promise<void>[] = [this._nullEffect.initialize(this._inputTexture)];
        for (const effect of this._effects.values()) {
            initPromises.push(effect.initialize(this._inputTexture));
        }
        await Promise.all(initPromises);

        if (this._localDebugMode) {
            this._engine.runRenderLoop(() => {
                this._currentEffect.renderFrame();
            });
        }
    }

    public videoEffectSelected(effectId: string | undefined): Promise<void> {
        console.log("videoEffectSelected() called", effectId);
        return Promise.resolve();
    }

    public startFilter(effect: SmartFilterEffect): void {
        const effectInstance = this._effects.get(effect);
        if (effectInstance) {
            this._startEffect(effectInstance);
        }
    }

    private _startEffect(effect: IEffect): void {
        if (this._currentEffect) {
            if (this._currentEffectCompletedObserver) {
                this._currentEffect.onEffectCompleted.remove(this._currentEffectCompletedObserver);
                this._currentEffectCompletedObserver = null;
            }
            this._currentEffect.stop(false);
        }

        this._currentEffect = effect;
        this._currentEffectCompletedObserver = this._currentEffect.onEffectCompleted.addOnce(() => {
            console.log(`[${effect.name}] Effect completed`);
            if (this._currentEffect == effect) {
                this._startEffect(this._nullEffect);
            }
        });
        this._currentEffect.start();
    }

    async videoFrameHandler(frame: videoEffects.VideoFrameData): Promise<VideoFrame> {
        try {
            const videoFrame = frame.videoFrame as VideoFrame;

            if (this._currentEffect === null) {
                return videoFrame;
            }

            this._engine.updateDynamicTexture(this._internalInputTexture, videoFrame as unknown as any, true);

            this._engine.beginFrame();
            this._currentEffect.renderFrame();
            this._engine.endFrame();

            const outputVideoFrame = new VideoFrame(this._outputCanvas, {
                displayHeight: videoFrame.displayHeight,
                displayWidth: videoFrame.displayWidth,
                timestamp: videoFrame.timestamp,
            });

            return outputVideoFrame;
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    async videoBufferHandler(
        _videoBufferData: videoEffects.VideoBufferData,
        _notifyVideoFrameProcessed: () => void,
        _notifyError: (error: string) => void
    ) {
        console.error("videoBufferHandler was called and is not yet implemented");
    }
}