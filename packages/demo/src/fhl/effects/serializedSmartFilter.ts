import {
    type SmartFilterRuntime,
    type SmartFilter,
    type InputBlock,
    type ConnectionPointType,
} from "@babylonjs/smart-filters";
import { SmartFilterDeserializer, createImageTexture } from "@babylonjs/smart-filters";
import type { ThinEngine } from "@babylonjs/core/Engines/thinEngine";
import type { ThinTexture } from "@babylonjs/core/Materials/Textures/thinTexture";
import { getBlockDeserializers } from "../../configuration/blockDeserializers";
import type { Nullable } from "@babylonjs/core/types";
import { splitAndRewireInputTextures } from "./effectHelpers";
import { SmartFilterRenderer } from "../../smartFilterRenderer";

export class SerializedSmartFilter {
    /**
     * The SmartFilter object we're managing. Null until the SmartFilter is loaded.
     */
    public smartFilter: Nullable<SmartFilter>;

    /**
     * The engine that the SmartFilter is running on
     */
    private _engine: ThinEngine;
    /**
     * Whether to use webcam or a local image for debugging. See SmartFilterVideoApp.
     */
    private _localDebugMode: boolean;

    /**
     * A promise that resolves when the SmartFilter is loaded and ready to use
     */
    private _smartFilterReady: Promise<void>;

    /**
     * A map of input block names to their corresponding input blocks
     */
    private _inputs: Map<string, Nullable<InputBlock<any>>>;

    /**
     * The name of the block that will contain the video frame input
     */

    private _videoName: string;

    /**
     * The name of the block containing the old mask texture. Can be "" if no mask.
     */
    private _videoMaskName: string;

    /**
     * Creates a new SerializedSmartFilter
     * @param engine - The SmartFilter's engine
     * @param localDebugMode - Whether to use webcam or a local image for debugging
     * @param serializedSmartFilter - The JSON object representing the SmartFilter
     * @param videoName - The name of the block that will contain the video frame input
     * @param videoMaskName - The name of the block containing the old mask
     * @param others - Additional input block names that will be updated by the effect
     */
    constructor(
        engine: ThinEngine,
        localDebugMode: boolean,
        serializedSmartFilter: any,
        videoName: string,
        videoMaskName: string,
        ...others: string[]
    ) {
        this._engine = engine;
        this._localDebugMode = localDebugMode;

        this.smartFilter = null;
        this._smartFilterReady = this._loadSmartFilter(serializedSmartFilter);

        this._inputs = new Map([
            [videoName, null],
            [videoMaskName, null],
            ...others.map((name) => [name, null] as [string, Nullable<InputBlock<any>>]),
        ]);
        this._videoName = videoName;
        this._videoMaskName = videoMaskName;
    }

    /**
     * Get the value of an input block asynchronously, if it exists
     * @param name - The name of the input block
     * @returns - A promise that resolves to the value of the input block
     */
    public async getInput(name: string) {
        await this._smartFilterReady;
        return this._inputs.get(name)?.runtimeValue.value;
    }

    /**
     * Set the value of an input block asynchronously, if it exists
     * @param name - The name of the input block
     */
    public async setInput(name: string, val: any) {
        await this._smartFilterReady;
        const inputBlock = this._inputs.get(name);
        if (inputBlock) {
            inputBlock.runtimeValue.value = val;
        }
    }

    /**
     * Load the SmartFilter from memory, then modify it to accomodate our segmentation technique
     * @param serializedSmartFilter - The JSON object representing the SmartFilter
     */
    protected async _loadSmartFilter(serializedSmartFilter: any): Promise<void> {
        const deserializer = new SmartFilterDeserializer(getBlockDeserializers());
        this.smartFilter = await deserializer.deserialize(this._engine, serializedSmartFilter);

        // Populate our inputs map
        this.smartFilter.attachedBlocks.forEach((block) => {
            const name = block.name;
            if (this._inputs.has(name)) {
                this._inputs.set(name, block as InputBlock<any>);
            }
        });

        // Set up our split texture
        const oldVideoFrame = this._inputs.get(this._videoName) as InputBlock<ConnectionPointType.Texture>;
        const oldVideoMask = this._inputs.get(this._videoMaskName) as InputBlock<ConnectionPointType.Texture>;
        splitAndRewireInputTextures(this.smartFilter, oldVideoFrame, oldVideoMask);
    }

    /**
     * Initialize the SmartFilterRuntime with the given input texture, or a default
     * image if we're in local debug mode.
     * @param inputTexture - The texture to use as the video input for the SmartFilter
     * @returns - A promise that resolves to the SmartFilterRuntime
     */
    public async initRuntime(inputTexture: ThinTexture): Promise<SmartFilterRuntime> {
        await this._smartFilterReady;
        const smartFilterRuntime = await this.smartFilter!.createRuntimeAsync(this._engine);

        // We need to load in original assets for the input blocks
        // I'm just gonna reuse the renderer's asset loading functionality
        const rendererTemp = new SmartFilterRenderer(this._engine);
        await rendererTemp.loadAssets(this.smartFilter!);

        if (this._localDebugMode) {
            inputTexture = createImageTexture(this._engine, "assets/stackedImageAndMask.png");
        }

        this.setInput(this._videoName, inputTexture);

        return smartFilterRuntime;
    }
}
