import ExpoModulesCore
import MetalKit
import simd
import SwiftUI

// ElevenLabs Components orb visualizer, isolated from its optional LiveKit
// convenience layer so the app keeps a single WebRTC implementation.
private enum VisualizerAgentState: Equatable {
  case connecting, initializing, listening, thinking, speaking, disconnected, unknown
}

private struct OrbUniforms {
  var time: Float = 0
  var animation: Float = 0
  var inverted: Float = 0
  var pad0: Float = 0
  var offsets: simd_float8 = .zero
  var color1: simd_float4 = .zero
  var color2: simd_float4 = .zero
  var inputVolume: Float = 0
  var outputVolume: Float = 0
  var pad1: SIMD2<Float> = .zero
}

private func colorToSIMD4(_ color: Color) -> simd_float4 {
  let uiColor = UIColor(color)
  var red: CGFloat = 0
  var green: CGFloat = 0
  var blue: CGFloat = 0
  var alpha: CGFloat = 1
  uiColor.getRed(&red, green: &green, blue: &blue, alpha: &alpha)
  func linear(_ value: CGFloat) -> Float {
    value <= 0.04045 ? Float(value / 12.92) : Float(pow((value + 0.055) / 1.055, 2.4))
  }
  return .init(linear(red), linear(green), linear(blue), Float(alpha))
}

private final class MetalOrbRenderer: NSObject, MTKViewDelegate {
  private let device: MTLDevice
  private let commandQueue: MTLCommandQueue
  private var pipeline: MTLRenderPipelineState!
  private var vertexBuffer: MTLBuffer!
  private let startTime = CACurrentMediaTime()
  private var animationTime: Float = 0
  private var uniforms = OrbUniforms()
  private var randomOffsets: [Float] = []
  private var agentState: VisualizerAgentState = .unknown
  private var isPreview = false

  override init() {
    guard let device = MTLCreateSystemDefaultDevice(), let queue = device.makeCommandQueue() else {
      fatalError("Metal is unavailable")
    }
    self.device = device
    commandQueue = queue
    super.init()
    randomOffsets = (0 ..< 7).map { _ in Float.random(in: 0 ... (Float.pi * 2)) }
    let vertices: [Float] = [-1, 1, -1, -1, 1, 1, 1, -1]
    vertexBuffer = device.makeBuffer(bytes: vertices, length: vertices.count * MemoryLayout<Float>.size)
    buildPipeline()
  }

  func update(color1: Color, color2: Color, input: Float, output: Float, state: VisualizerAgentState, preview: Bool) {
    uniforms.color1 = colorToSIMD4(color1)
    uniforms.color2 = colorToSIMD4(color2)
    uniforms.inputVolume = max(0, min(1, input))
    uniforms.outputVolume = max(0, min(1, output))
    uniforms.inverted = 0
    agentState = state
    isPreview = preview
  }

  func mtkView(_: MTKView, drawableSizeWillChange _: CGSize) {}

  func draw(in view: MTKView) {
    guard let drawable = view.currentDrawable,
          let descriptor = view.currentRenderPassDescriptor,
          let command = commandQueue.makeCommandBuffer(),
          let encoder = command.makeRenderCommandEncoder(descriptor: descriptor) else { return }
    let elapsed = Float(CACurrentMediaTime() - startTime)
    if isPreview {
      let cycle = elapsed.truncatingRemainder(dividingBy: 36)
      let loopTime = cycle <= 18 ? cycle / 18 * 8 : (36 - cycle) / 18 * 8
      uniforms.time = loopTime
      uniforms.animation = loopTime * 0.1
    } else {
      let fps = max(view.preferredFramesPerSecond, 1)
      animationTime += (1 / Float(fps)) * (agentState == .thinking ? 0.02 : 0.1)
      uniforms.time = elapsed
      uniforms.animation = animationTime
    }
    uniforms.offsets = simd_float8(randomOffsets + [0])
    encoder.setRenderPipelineState(pipeline)
    encoder.setVertexBuffer(vertexBuffer, offset: 0, index: 0)
    var values = uniforms
    encoder.setFragmentBytes(&values, length: MemoryLayout<OrbUniforms>.stride, index: 0)
    encoder.drawPrimitives(type: .triangleStrip, vertexStart: 0, vertexCount: 4)
    encoder.endEncoding()
    command.present(drawable)
    command.commit()
  }

  private func buildPipeline() {
    let classBundle = Bundle(for: MetalOrbRenderer.self)
    let resourceURL = classBundle.url(forResource: "FlyntElevenLabsOrbResources", withExtension: "bundle")
      ?? Bundle.main.url(forResource: "FlyntElevenLabsOrbResources", withExtension: "bundle")
    let resourceBundle = resourceURL.flatMap(Bundle.init(url:))
    let library = resourceBundle.flatMap { try? device.makeDefaultLibrary(bundle: $0) }
      ?? (try? device.makeDefaultLibrary(bundle: classBundle))
      ?? device.makeDefaultLibrary()
    guard let library,
          let vertex = library.makeFunction(name: "orbVertexShader"),
          let fragment = library.makeFunction(name: "orbFragmentShader") else {
      fatalError("ElevenLabs orb shader is unavailable")
    }
    let descriptor = MTLRenderPipelineDescriptor()
    descriptor.vertexFunction = vertex
    descriptor.fragmentFunction = fragment
    descriptor.colorAttachments[0].pixelFormat = .bgra8Unorm
    do {
      pipeline = try device.makeRenderPipelineState(descriptor: descriptor)
    } catch {
      fatalError("ElevenLabs orb pipeline failed: \(error)")
    }
  }
}

private struct OrbPlatformView: UIViewRepresentable {
  let color1: Color
  let color2: Color
  let inputVolume: Float
  let outputVolume: Float
  let agentState: VisualizerAgentState
  let previewActive: Bool
  let previewMode: Bool

  func makeUIView(context: Context) -> MTKView {
    let view = MTKView()
    let shouldPause = previewMode && !previewActive
    view.device = MTLCreateSystemDefaultDevice()
    view.delegate = context.coordinator
    view.framebufferOnly = false
    view.isPaused = shouldPause
    view.enableSetNeedsDisplay = shouldPause
    view.preferredFramesPerSecond = previewMode ? 24 : 60
    view.clearColor = .init(red: 0, green: 0, blue: 0, alpha: 0)
    view.colorPixelFormat = .bgra8Unorm
    view.autoResizeDrawable = true
    context.coordinator.update(color1: color1, color2: color2, input: inputVolume, output: outputVolume, state: agentState, preview: previewMode)
    if shouldPause { view.setNeedsDisplay() }
    return view
  }

  func updateUIView(_ view: MTKView, context: Context) {
    let shouldPause = previewMode && !previewActive
    view.isPaused = shouldPause
    view.enableSetNeedsDisplay = shouldPause
    view.preferredFramesPerSecond = previewMode ? 24 : 60
    context.coordinator.update(color1: color1, color2: color2, input: inputVolume, output: outputVolume, state: agentState, preview: previewMode)
    if shouldPause { view.setNeedsDisplay() }
  }

  func makeCoordinator() -> MetalOrbRenderer { MetalOrbRenderer() }
}

private struct ElevenLabsOrb: View {
  let color1: Color
  let color2: Color
  let inputVolume: Float
  let outputVolume: Float
  let agentState: VisualizerAgentState
  let previewActive: Bool
  let previewMode: Bool

  var body: some View {
    GeometryReader { geometry in
      let side = max(1, min(geometry.size.width, geometry.size.height))
      OrbPlatformView(
        color1: color1,
        color2: color2,
        inputVolume: inputVolume,
        outputVolume: outputVolume,
        agentState: agentState,
        previewActive: previewActive,
        previewMode: previewMode
      )
      .frame(width: side, height: side)
      .clipShape(Circle())
      .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    .aspectRatio(1, contentMode: .fit)
  }
}

private struct FlyntOrbRoot: View {
  let agentState: VisualizerAgentState
  let colorOne: UIColor
  let colorTwo: UIColor
  let inputVolume: Float
  let outputVolume: Float
  let previewActive: Bool
  let previewMode: Bool
  let reduceMotion: Bool

  var body: some View {
    Group {
      if reduceMotion {
        Circle()
          .fill(
            LinearGradient(
              colors: [Color(uiColor: colorOne), Color(uiColor: colorTwo)],
              startPoint: .topLeading,
              endPoint: .bottomTrailing
            )
          )
      } else {
        ElevenLabsOrb(
          color1: Color(uiColor: colorOne),
          color2: Color(uiColor: colorTwo),
          inputVolume: inputVolume,
          outputVolume: outputVolume,
          agentState: agentState,
          previewActive: previewActive,
          previewMode: previewMode
        )
      }
    }
    .accessibilityHidden(true)
  }
}

public final class FlyntElevenLabsOrbView: ExpoView {
  private let host = UIHostingController(rootView: AnyView(EmptyView()))
  private var state: VisualizerAgentState = .unknown
  private var colorOne = UIColor(red: 0.31, green: 0.82, blue: 0.84, alpha: 1)
  private var colorTwo = UIColor(red: 0.04, green: 0.29, blue: 0.72, alpha: 1)
  private var inputVolume: Float = 0
  private var outputVolume: Float = 0
  private var previewActive = true
  private var previewMode = false

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    backgroundColor = .clear
    isUserInteractionEnabled = false
    isAccessibilityElement = false
    host.view.backgroundColor = .clear
    host.view.isUserInteractionEnabled = false
    addSubview(host.view)
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(reduceMotionChanged),
      name: UIAccessibility.reduceMotionStatusDidChangeNotification,
      object: nil
    )
    render()
  }

  deinit {
    NotificationCenter.default.removeObserver(self)
  }

  override public func layoutSubviews() {
    super.layoutSubviews()
    host.view.frame = bounds
  }

  func setAgentState(_ value: String) {
    state = switch value {
    case "connecting": .connecting
    case "disconnected": .disconnected
    case "initializing": .initializing
    case "listening": .listening
    case "speaking": .speaking
    case "thinking": .thinking
    default: .unknown
    }
    render()
  }

  func setColorOne(_ value: UIColor) {
    colorOne = value
    render()
  }

  func setColorTwo(_ value: UIColor) {
    colorTwo = value
    render()
  }

  func setInputVolume(_ value: Double) {
    inputVolume = Float(max(0, min(1, value)))
    render()
  }

  func setOutputVolume(_ value: Double) {
    outputVolume = Float(max(0, min(1, value)))
    render()
  }

  func setPreviewActive(_ value: Bool) {
    previewActive = value
    render()
  }

  func setPreviewMode(_ value: Bool) {
    previewMode = value
    render()
  }

  @objc private func reduceMotionChanged() {
    render()
  }

  private func render() {
    host.rootView = AnyView(
      FlyntOrbRoot(
        agentState: state,
        colorOne: colorOne,
        colorTwo: colorTwo,
        inputVolume: inputVolume,
        outputVolume: outputVolume,
        previewActive: previewActive,
        previewMode: previewMode,
        reduceMotion: UIAccessibility.isReduceMotionEnabled
      )
    )
  }
}
