import ExpoModulesCore
import MobileRTC

public class ZoomModule: Module {
    var zoom = ZoomSDK()

  public func definition() -> ModuleDefinition {
    Name("ZoomModule")

    AsyncFunction("initialize") { (jwt: String) -> Void in
        print("Inside initialize")
        self.zoom.initialize(jwt)
    }

    AsyncFunction("joinMeeting") { (zak: String, displayName: String, meetingNumber: String) -> Void in
        print("Inside initialize")
        self.zoom.joinMeeting(zak, displayName:displayName, meetingNumber:meetingNumber)
    }
  }
}
