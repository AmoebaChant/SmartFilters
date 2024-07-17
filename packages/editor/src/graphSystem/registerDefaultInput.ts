import { BlockNodeData } from "./blockNodeData.js";
import type { ConnectionPoint, SmartFilter, RuntimeData } from "@babylonjs/smart-filters";
import { InputBlock, ConnectionPointType, createStrongRef } from "@babylonjs/smart-filters";
import { RawTexture } from "@babylonjs/core/Materials/Textures/rawTexture.js";
import type { GlobalState } from "../globalState";
import type { INodeContainer } from "@babylonjs/shared-ui-components/nodeGraphSystem/interfaces/nodeContainer";
import type { IPortData } from "@babylonjs/shared-ui-components/nodeGraphSystem/interfaces/portData";
import type { StateManager } from "@babylonjs/shared-ui-components/nodeGraphSystem/stateManager";
import type { ThinEngine } from "@babylonjs/core/Engines/thinEngine";
import type { ThinTexture } from "@babylonjs/core/Materials/Textures/thinTexture";

import "@babylonjs/core/Engines/Extensions/engine.dynamicTexture.js";
import "@babylonjs/core/Engines/Extensions/engine.videoTexture.js";
import { WebCamInputBlock } from "../demoBlocks/index.js";

/**
 * Creates a default value for the input block of a certain type
 * @param type - defines the type of the input block
 * @returns a strong ref containing the default value
 */
function createDefaultValue<U extends ConnectionPointType>(type: U, engine: ThinEngine): RuntimeData<U> {
    // conversion needed due to https://github.com/microsoft/TypeScript/issues/33014
    switch (type) {
        case ConnectionPointType.Boolean:
            return createStrongRef(false) as RuntimeData<U>;
        case ConnectionPointType.Float:
            return createStrongRef(0) as RuntimeData<U>;
        case ConnectionPointType.Color3:
            return createStrongRef({ r: 0, g: 0, b: 0 }) as RuntimeData<U>;
        case ConnectionPointType.Texture:
            return createStrongRef(
                new RawTexture(
                    new Uint8Array([255, 255, 255, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 255, 255, 255]),
                    2,
                    2,
                    5,
                    engine
                ) as ThinTexture
            ) as RuntimeData<U>; // Constants.TEXTUREFORMAT_RGBA = 5
        default:
            throw new Error(`Unknown connection point type ${type}`);
    }
}

export function createDefaultInput<U extends ConnectionPointType>(
    smartFilter: SmartFilter,
    type: U,
    engine: ThinEngine
): InputBlock<U> {
    const name = ConnectionPointType[type] ?? "Unknown";
    const inputBlock = new InputBlock(smartFilter, name, type, createDefaultValue(type, engine));
    return inputBlock;
}

export function createDefaultInputForConnectionPoint<U extends ConnectionPointType>(
    smartFilter: SmartFilter,
    point: ConnectionPoint<U>,
    engine: ThinEngine
): InputBlock<U> {
    const name = point.name;
    const inputBlock = new InputBlock(
        smartFilter,
        name,
        point.type,
        point.defaultRuntimeData ?? createDefaultValue(point.type, engine)
    );
    return inputBlock;
}

export function createWebCamInput(
    smartFilter: SmartFilter,
    engine: ThinEngine
): InputBlock<ConnectionPointType.Texture> {
    return new WebCamInputBlock(smartFilter, engine, createDefaultValue(ConnectionPointType.Texture, engine));
}

export const RegisterDefaultInput = (stateManager: StateManager) => {
    stateManager.createDefaultInputData = (rootData: any, portData: IPortData, nodeContainer: INodeContainer) => {
        const point = portData.data as ConnectionPoint;
        // const customInputBlock = point.createCustomInputBlock();
        const pointName = "output";
        // let emittedBlock;

        const globalState = rootData as GlobalState;

        const smartFilter = globalState.smartFilter;
        // if (!customInputBlock) {
        // if (point.type === SmartFilterConnectionPointTypes.AutoDetect) {
        //     return null;
        // }
        const emittedBlock = createDefaultInputForConnectionPoint(smartFilter, point, globalState.engine);
        // } else {
        //     [emittedBlock, pointName] = customInputBlock;
        // }

        // TODO. Dynamic block creation
        // smartFilter.attachedBlocks.push(emittedBlock);
        // if (!emittedBlock.isInput) {
        //     emittedBlock.autoConfigure(smartFilter);
        // }

        return {
            data: new BlockNodeData(emittedBlock, nodeContainer),
            name: pointName,
        };
    };
};