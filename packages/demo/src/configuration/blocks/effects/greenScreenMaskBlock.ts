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
            uniform sampler2D _input_;
            uniform vec3 _reference_;
            uniform float _distance_;
            uniform vec4 _backgroundColor_;
            `,

        mainFunctionName: "_greenScreen_",

        mainInputTexture: "_input_",

        functions: [
            {
                name: "_greenScreen_",
                code: `
                vec4 _greenScreen_(vec2 vUV)
                {
                    vec4 color = texture2D(_input_, vUV);
                
                    if (length(color.rgb - _reference_) < _distance_) {
                        color = _backgroundColor_;
                    }

                    return color;
                }
            `,
            },
        ],
    },
});

/**
 * The shader bindings for the GreenScreenMask block.
 */
class GreenScreenMaskShaderBinding extends ShaderBinding {
    private readonly _inputTexture: RuntimeData<ConnectionPointType.Texture>;
    private readonly _backgroundColor: RuntimeData<ConnectionPointType.Color4>;
    private readonly _reference: RuntimeData<ConnectionPointType.Color3>;
    private readonly _distance: RuntimeData<ConnectionPointType.Float>;

    /**
     * Creates a new shader binding instance for the GreenScreenMask block.
     * @param parentBlock - The parent block
     * @param inputTexture - the input texture
     * @param backgroundColor - the background color
     * @param reference - the reference color
     * @param distance - the distance from the reference color
     */
    constructor(
        parentBlock: IDisableableBlock,
        inputTexture: RuntimeData<ConnectionPointType.Texture>,
        backgroundColor: RuntimeData<ConnectionPointType.Color4>,
        reference: RuntimeData<ConnectionPointType.Color3>,
        distance: RuntimeData<ConnectionPointType.Float>
    ) {
        super(parentBlock);
        this._inputTexture = inputTexture;
        this._backgroundColor = backgroundColor;
        this._reference = reference;
        this._distance = distance;
    }

    /**
     * Binds all the required data to the shader when rendering.
     * @param effect - defines the effect to bind the data to
     */
    public override bind(effect: Effect): void {
        super.bind(effect);
        effect.setTexture(this.getRemappedName("input"), this._inputTexture.value);
        effect.setDirectColor4(this.getRemappedName("backgroundColor"), this._backgroundColor.value);
        effect.setColor3(this.getRemappedName("reference"), this._reference.value);
        effect.setFloat(this.getRemappedName("distance"), this._distance.value);
    }
}

/**
 * A simple block to replace a color with another color, used for masking green screens.
 */
export class GreenScreenMaskBlock extends ShaderBlock {
    /**
     * The class name of the block.
     */
    public static override ClassName = BlockNames.greenScreenMask;

    /**
     * The input texture connection point.
     */
    public readonly input = this._registerInput("input", ConnectionPointType.Texture);

    /**
     * The background color connection point.
     */
    public readonly backgroundColor = this._registerOptionalInput(
        "background",
        ConnectionPointType.Color4,
        createStrongRef({ r: 0, g: 0, b: 0, a: 0 })
    );

    /**
     * The reference color of the green screen.
     */
    public readonly reference = this._registerInput("reference", ConnectionPointType.Color3);

    /**
     * The "distance" from the color the reference is allowed to have for replacement.
     */
    public readonly distance = this._registerOptionalInput("distance", ConnectionPointType.Float, createStrongRef(0.1));

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
        const input = this._confirmRuntimeDataSupplied(this.input);
        const reference = this._confirmRuntimeDataSupplied(this.reference);
        const distance = this.distance.runtimeData;

        return new GreenScreenMaskShaderBinding(this, input, this.backgroundColor.runtimeData, reference, distance);
    }
}
