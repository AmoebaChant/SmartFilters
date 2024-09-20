import type { Effect } from "@babylonjs/core/Materials/effect";

import type { SmartFilter, IDisableableBlock, RuntimeData } from "@babylonjs/smart-filters";
import {
    ShaderBlock,
    ConnectionPointType,
    ShaderBinding,
    injectDisableUniform,
    createStrongRef,
} from "@babylonjs/smart-filters";
import { BlockNames } from "../blockNames";

const shaderProgram = injectDisableUniform({
    fragment: {
        uniform: `
            uniform sampler2D _input1_;
            uniform sampler2D _input2_;
            uniform float _amount_;
            `,

        mainFunctionName: "_fade_",

        mainInputTexture: "_input1_",

        functions: [
            {
                name: "_fade_",
                code: `
                vec4 _fade_(vec2 vUV) {
                    vec4 color1 = texture2D(_input1_, vUV);
                    vec4 color2 = texture2D(_input2_, vUV);

                    return mix(color1, color2, _amount_);
                }
            `,
            },
        ],
    },
});

/**
 * The shader bindings for the Fade block.
 */
class FadeShaderBinding extends ShaderBinding {
    private readonly _inputTexture1: RuntimeData<ConnectionPointType.Texture>;
    private readonly _inputTexture2: RuntimeData<ConnectionPointType.Texture>;
    private readonly _amount: RuntimeData<ConnectionPointType.Float>;

    /**
     * Creates a new shader binding instance for the Fade block.
     * @param parentBlock - The parent block
     * @param inputTexture1 - The first texture
     * @param inputTexture2 - The second texture
     * @param amount - The amount to fade between the two textures (0.0 is all inputTexture1, 1.0 is all inputTexture2)
     */
    constructor(
        parentBlock: IDisableableBlock,
        inputTexture1: RuntimeData<ConnectionPointType.Texture>,
        inputTexture2: RuntimeData<ConnectionPointType.Texture>,
        amount: RuntimeData<ConnectionPointType.Float>
    ) {
        super(parentBlock);
        this._inputTexture1 = inputTexture1;
        this._inputTexture2 = inputTexture2;
        this._amount = amount;
    }

    /**
     * Binds all the required data to the shader when rendering.
     * @param effect - defines the effect to bind the data to
     */
    public override bind(effect: Effect): void {
        super.bind(effect);
        effect.setTexture(this.getRemappedName("input1"), this._inputTexture1.value);
        effect.setTexture(this.getRemappedName("input2"), this._inputTexture2.value);
        effect.setFloat(this.getRemappedName("amount"), this._amount.value);
    }
}

/**
 * A simple block to fade from one texture to another.
 */
export class FadeBlock extends ShaderBlock {
    /**
     * The class name of the block.
     */
    public static override ClassName = BlockNames.contrast;

    /**
     * The input1 texture connection point.
     */
    public readonly input1 = this._registerInput("input1", ConnectionPointType.Texture);

    /**
     * The input2 texture connection point.
     */
    public readonly input2 = this._registerInput("input2", ConnectionPointType.Texture);

    /**
     * The amount to face between the two textures (0.0 is all input1, 1.0 is all input2)
     */
    public readonly amount = this._registerOptionalInput("amount", ConnectionPointType.Float, createStrongRef(0.0));

    /**
     * The shader program (vertex and fragment code) to use to render the block
     */
    public static override ShaderCode = shaderProgram;

    /**
     * Instantiates a new Block.
     * @param smartFilter - The smart filter this block belongs to
     * @param name - The friendly name of the block
     */
    constructor(smartFilter: SmartFilter, name: string) {
        super(smartFilter, name);
    }

    /**
     * Get the class instance that binds all the required data to the shader (effect) when rendering.
     * @returns The class instance that binds the data to the effect
     */
    public getShaderBinding(): ShaderBinding {
        const input1 = this._confirmRuntimeDataSupplied(this.input1);
        const input2 = this._confirmRuntimeDataSupplied(this.input2);
        const amount = this.amount.runtimeData;

        return new FadeShaderBinding(this, input1, input2, amount);
    }
}
