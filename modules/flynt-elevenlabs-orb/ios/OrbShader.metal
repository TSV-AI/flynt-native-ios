// Copyright 2025 Eleven Labs Inc. Licensed under Apache License 2.0.
#include <metal_stdlib>
using namespace metal;

constant float PI = 3.14159265358979323846;

struct VertexOut { float4 position [[position]]; float2 uv; };
struct OrbUniforms {
  float time; float animation; float inverted; float pad0;
  float offsets[8]; float4 color1; float4 color2;
  float inputVolume; float outputVolume; float2 pad1;
};

vertex VertexOut orbVertexShader(uint vertexID [[vertex_id]], constant float2* vertices [[buffer(0)]]) {
  VertexOut out;
  float2 position = vertices[vertexID];
  out.position = float4(position, 0.0, 1.0);
  out.uv = position * 0.5 + 0.5;
  return out;
}

float2 hash2(float2 p) {
  return fract(sin(float2(dot(p, float2(127.1, 311.7)), dot(p, float2(269.5, 183.3)))) * 43758.5453);
}

float noise2D(float2 p) {
  float2 i = floor(p);
  float2 f = fract(p);
  float2 u = f * f * (3.0 - 2.0 * f);
  float n = mix(
    mix(dot(hash2(i), f), dot(hash2(i + float2(1.0, 0.0)), f - float2(1.0, 0.0)), u.x),
    mix(dot(hash2(i + float2(0.0, 1.0)), f - float2(0.0, 1.0)),
        dot(hash2(i + float2(1.0, 1.0)), f - float2(1.0, 1.0)), u.x), u.y);
  return 0.5 + 0.5 * n;
}

float perlinTexture(float2 uv) { return noise2D(uv * 8.0); }

bool drawOval(float2 polarUv, float2 center, float a, float b, bool reverse, float softness, thread float4& color) {
  float2 p = polarUv - center;
  float oval = (p.x * p.x) / (a * a) + (p.y * p.y) / (b * b);
  float edge = smoothstep(1.0, 1.0 - softness, oval);
  if (edge <= 0.0) return false;
  float gradient = reverse ? 1.0 - (p.x / a + 1.0) / 2.0 : (p.x / a + 1.0) / 2.0;
  color = float4(float3(gradient), min(1.2 * edge, 1.0));
  return true;
}

float3 colorRamp(float grayscale, float3 color1, float3 color2, float3 color3, float3 color4) {
  if (grayscale < 0.33) return mix(color1, color2, grayscale * 3.0);
  if (grayscale < 0.66) return mix(color2, color3, (grayscale - 0.33) * 3.0);
  return mix(color3, color4, (grayscale - 0.66) * 3.0);
}

float sharpRing(float3 decomposed, float time) {
  float noise = mix(noise2D(float2(decomposed.x, time) * 5.0),
                    noise2D(float2(decomposed.y, time) * 5.0), decomposed.z);
  return 1.0 + (noise - 0.5) * 4.0 * 0.5 * 1.5;
}

float smoothRing(float3 decomposed, float time) {
  float noise = mix(noise2D(float2(decomposed.x, time) * 6.0),
                    noise2D(float2(decomposed.y, time) * 6.0), decomposed.z);
  return 0.9 + (noise - 0.5) * 8.0 * 0.3;
}

float flow(float3 decomposed, float time) {
  return mix(perlinTexture(float2(time, decomposed.x / 2.0)),
             perlinTexture(float2(time, decomposed.y / 2.0)), decomposed.z);
}

fragment float4 orbFragmentShader(VertexOut in [[stage_in]], constant OrbUniforms& uniforms [[buffer(0)]]) {
  float2 uv = in.uv * 2.0 - 1.0;
  float radius = length(uv);
  float theta = atan2(uv.y, uv.x);
  if (theta < 0.0) theta += 2.0 * PI;
  float3 decomposed = float3(theta / (2.0 * PI), fmod(theta / (2.0 * PI) + 0.5, 1.0) + 1.0, abs(theta / PI - 1.0));
  theta += (flow(decomposed, radius * 0.03 - uniforms.animation * 0.2) - 0.5) * mix(0.5, 1.0, uniforms.outputVolume);
  float4 color = float4(1.0);
  float originalCenters[7] = {0.0, 0.5 * PI, PI, 1.5 * PI, 2.0 * PI, 2.5 * PI, 3.0 * PI};
  float centers[7];
  for (int i = 0; i < 7; i++) centers[i] = originalCenters[i] + 0.5 * sin(uniforms.time / 20.0 + uniforms.offsets[i]);
  for (int i = 0; i < 7; i++) {
    float noise = perlinTexture(float2(fmod(centers[i] + uniforms.time * 0.05, 1.0), 0.5));
    float a = 0.5 + noise * 0.5;
    float b = noise * mix(4.5, 3.0, uniforms.inputVolume);
    float distanceTheta = min(abs(theta - centers[i]), min(abs(theta + 2.0 * PI - centers[i]), abs(theta - 2.0 * PI - centers[i])));
    float4 ovalColor;
    if (drawOval(float2(distanceTheta, radius), float2(0.0), a, b, i % 2 == 1, 0.4, ovalColor)) {
      color.rgb = mix(color.rgb, ovalColor.rgb, ovalColor.a);
    }
  }
  float ring1 = radius + uniforms.inputVolume * 0.2 >= sharpRing(decomposed, uniforms.time * 0.1)
    ? mix(0.3, 0.8, uniforms.inputVolume) : 0.0;
  float ring2 = smoothstep(smoothRing(decomposed, uniforms.time * 0.1) - 0.05,
                           smoothRing(decomposed, uniforms.time * 0.1) + 0.05,
                           radius + uniforms.inputVolume * 0.3) * mix(0.25, 0.6, uniforms.inputVolume);
  color.rgb = 1.0 - (1.0 - color.rgb) * (1.0 - float3(max(ring1, ring2)));
  float luminance = mix(color.r, 1.0 - color.r, uniforms.inverted);
  color.rgb = colorRamp(luminance, float3(0.0), uniforms.color1.xyz, uniforms.color2.xyz, float3(1.0));
  color.a = 1.0;
  return color;
}
