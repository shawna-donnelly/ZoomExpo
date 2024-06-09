import Foundation
import MobileRTC

@objc(ZoomSDK)
class ZoomSDK: NSObject, MobileRTCAuthDelegate, MobileRTCMeetingServiceDelegate {
    @objc
    func initialize(_ jwt: String) {
      DispatchQueue.main.async {
        print("inside initialize - ios", jwt)
        let sdk = MobileRTC.shared()
        let initContext = MobileRTCSDKInitContext()
        initContext.domain = "https://zoom.us"
        initContext.enableLog = true
        
        // let bundlePath = Bundle.main.bundlePath
        // initContext.bundleResPath = bundlePath

        if let bundlePath = Bundle.main.path(forResource: "MobileRTCResources", ofType: "bundle"),
          let resourceBundle = Bundle(path: bundlePath) {
            // Bundle loaded successfully
            print("Loaded MobileRTCResources.bundle")
            initContext.bundleResPath = bundlePath // Set the bundle resource path in the init context
        } else {
            // Handle the error
            print("Failed to load MobileRTCResources.bundle")
        }
          
          
        
        sdk.initialize(initContext)
        
        self.authenticateMobileRTCWith(jwt: jwt)

      }
    }

  @objc
  func joinMeeting(_ zak: String, displayName: String, meetingNumber: String) {
    print("Inside joinMeeting")
      DispatchQueue.main.async {
        let startParams = MobileRTCMeetingStartParam4WithoutLoginUser()
        startParams.zak = zak
        startParams.meetingNumber = meetingNumber // TODO: Add your meeting number
        startParams.userName = displayName // TODO: Add your display name
        
        print(startParams.userName!, startParams.zak, startParams.meetingNumber!)

        let meetingService = MobileRTC.shared().getMeetingService()
        print("meeting service",meetingService?.description ?? "missing" )
        meetingService?.delegate = self
        
        let meetingResult = meetingService?.startMeeting(with: startParams)
        if (meetingResult == .success) {
            // The SDK will attempt to join the meeting, see onMeetingStateChange callback.
          print("meetingResult successful")
        }
        else{
          print("Uh oh...", meetingResult!)
        }

      }
    }

  func authenticateMobileRTCWith(jwt: String) {
      if let authService = MobileRTC.shared().getAuthService() {
          authService.jwtToken = jwt
          authService.delegate = self
          authService.sdkAuth()
      }
  }
  
  func onMobileRTCAuthReturn(_ returnValue: MobileRTCAuthError) {
      switch returnValue {
        case .success:
        print("SDK successfully initialized.", returnValue.rawValue)
        //ZoomEventEmitter.sharedInstance?.emitEvent(withName: "onAuthSuccess", body: ["message": "SDK successfully initialized."])

        case .tokenWrong:
            print("SDK JWT is not valid.")
            //ZoomEventEmitter.sharedInstance?.emitEvent(withName: "onAuthFailure", body: ["message": "SDK not successfully initialized."])

      case .accountNotEnableSDK:
            print("Account not enable sdk")
            //ZoomEventEmitter.sharedInstance?.emitEvent(withName: "onAuthFailure", body: ["message": "SDK not successfully initialized."])

        default:
            print("SDK Authorization failed with MobileRTCAuthError: \(returnValue).")
            //ZoomEventEmitter.sharedInstance?.emitEvent(withName: "onAuthFailure", body: ["message": "SDK not successfully initialized."])
        }
    }
}
