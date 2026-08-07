import ExpoModulesCore

public final class FlyntElevenLabsOrbModule: Module {
  public func definition() -> ModuleDefinition {
    Name("FlyntElevenLabsOrb")

    View(FlyntElevenLabsOrbView.self) {
      Prop("agentState") { (view, state: String) in
        view.setAgentState(state)
      }

      Prop("colorOne") { (view, color: UIColor) in
        view.setColorOne(color)
      }

      Prop("colorTwo") { (view, color: UIColor) in
        view.setColorTwo(color)
      }

      Prop("inputVolume") { (view, volume: Double) in
        view.setInputVolume(volume)
      }

      Prop("outputVolume") { (view, volume: Double) in
        view.setOutputVolume(volume)
      }

      Prop("previewActive") { (view, active: Bool) in
        view.setPreviewActive(active)
      }

      Prop("previewMode") { (view, enabled: Bool) in
        view.setPreviewMode(enabled)
      }
    }
  }
}
