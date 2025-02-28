// { "smartFilterBlockType": "WipeBlock", "namespace": "Babylon.Demo.Transitions" }


const float HALF_PI = 1.57079632679;
const float LARGE = 10000.0;

uniform sampler2D textureA;
uniform sampler2D textureB; // main
uniform float progress;

vec4 wipe(vec2 vUV) { // main
    vec4 colorA = texture2D(textureA, vUV);
    vec4 colorB = texture2D(textureB, vUV);
    return mix(colorB, colorA, step(progress, vUV.y));
}
