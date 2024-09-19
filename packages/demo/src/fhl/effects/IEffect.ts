import type { ThinTexture } from "@babylonjs/core/Materials/Textures/thinTexture";
import type { Observable } from "@babylonjs/core/Misc/observable";

export interface IEffect {
    readonly isStarted: boolean;
    readonly name: string;

    start(): void;
    stop(notifyEffectCompleted: boolean): void;
    renderFrame(): void;

    initialize(inputTexture: ThinTexture): Promise<void>;

    readonly onEffectCompleted: Observable<void>;
}
