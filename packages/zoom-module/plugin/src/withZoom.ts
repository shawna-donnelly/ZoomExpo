import {
  AndroidConfig,
  withProjectBuildGradle,
  ConfigPlugin,
  createRunOncePlugin,
  withInfoPlist,
  withAndroidManifest,
  withDangerousMod,
  withAppBuildGradle,
} from "@expo/config-plugins";
import {
  createGeneratedHeaderComment,
  MergeResults,
  removeGeneratedContents,
} from "@expo/config-plugins/build/utils/generateCode";
import { copyFileSync, mkdirSync } from "fs";
import { copy } from "fs-extra";
import { resolve, dirname } from "path";

const pkg = require("zoom-module/package.json");

const CAMERA_USAGE = "Allow $(PRODUCT_NAME) to access your camera";
const MICROPHONE_USAGE = "Allow $(PRODUCT_NAME) to access your microphone";

// Define the local Maven repository path
// const gradleMaven = [
//   `def expoZoomMavenPath = new File(["node", "--print", "require.resolve('zoom-module/package.json')"].execute(null, rootDir).text.trim(), "../android/maven")`,
//   `allprojects { repositories { maven { url(expoZoomMavenPath) } } }`,
// ].join("\n");

const gradleMaven = [
  `allprojects { 
    repositories { 
      flatDir {
        dirs 'libs'
      }
    } 
  }`,
].join("\n");

const implementationLine =
  "implementation fileTree(dir: 'libs', include: ['*.aar'])";

const withAndroidZoomGradle: ConfigPlugin = (config) => {
  config = withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === "groovy") {
      config.modResults.contents = addZoomImport(
        config.modResults.contents
      ).contents;
    } else {
      throw new Error(
        "Cannot add zoom maven gradle because the build.gradle is not groovy"
      );
    }
    return config;
  });

  config = withAppBuildGradle(config, (config) => {
    const implementationLine =
      "implementation fileTree(dir: 'libs', include: ['*.aar'])";

    if (!config.modResults.contents.includes(implementationLine)) {
      const dependenciesBlockMatch =
        config.modResults.contents.match(/dependencies\s?{/);

      if (dependenciesBlockMatch && dependenciesBlockMatch.index) {
        const dependenciesBlockIndex =
          dependenciesBlockMatch.index + dependenciesBlockMatch[0].length;
        config.modResults.contents = [
          config.modResults.contents.slice(0, dependenciesBlockIndex),
          `\n    ${implementationLine}`,
          config.modResults.contents.slice(dependenciesBlockIndex),
        ].join("");
      }
    }

    return config;
  });

  return config;
};

export function addZoomImport(src: string): MergeResults {
  return appendContents({
    tag: "expo-zoom-import",
    src,
    newSrc: gradleMaven,
    comment: "//",
  });
}

export function addZoomAppGradleImport(src: string): MergeResults {
  return appendContents({
    tag: "expo-zoom-import",
    src,
    newSrc: implementationLine,
    comment: "//",
  });
}

// Fork of config-plugins mergeContents, but appends the contents to the end of the file.
function appendContents({
  src,
  newSrc,
  tag,
  comment,
}: {
  src: string;
  newSrc: string;
  tag: string;
  comment: string;
}): MergeResults {
  const header = createGeneratedHeaderComment(newSrc, tag, comment);
  if (!src.includes(header)) {
    // Ensure the old generated contents are removed.
    const sanitizedTarget = removeGeneratedContents(src, tag);
    const contentsToAdd = [
      // @something
      header,
      // contents
      newSrc,
      // @end
      `${comment} @generated end ${tag}`,
    ].join("\n");

    return {
      contents: sanitizedTarget ?? src + contentsToAdd,
      didMerge: true,
      didClear: !!sanitizedTarget,
    };
  }
  return { contents: src, didClear: false, didMerge: false };
}

const withZoom: ConfigPlugin<{
  cameraPermission?: string;
  microphonePermission?: string;
  recordAudioAndroid?: boolean;
}> = (
  config,
  { cameraPermission, microphonePermission, recordAudioAndroid = true } = {}
) => {
  config = withInfoPlist(config, (config) => {
    config.modResults.NSCameraUsageDescription =
      cameraPermission ||
      config.modResults.NSCameraUsageDescription ||
      CAMERA_USAGE;

    config.modResults.NSMicrophoneUsageDescription =
      microphonePermission ||
      config.modResults.NSMicrophoneUsageDescription ||
      MICROPHONE_USAGE;

    return config;
  });

  config = AndroidConfig.Permissions.withPermissions(
    config,
    [
      "android.permission.CAMERA",
      // Optional
      recordAudioAndroid && "android.permission.RECORD_AUDIO",
    ].filter(Boolean) as string[]
  );

  config = withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    // Add xmlns:tools to the manifest tag
    if (!manifest.$["xmlns:tools"]) {
      manifest.$["xmlns:tools"] = "http://schemas.android.com/tools";
    }

    // Add tools:replace to the application tag
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(
      config.modResults
    );
    application.$["tools:replace"] = "android:allowBackup";

    // Reference the network security configuration file
    application.$["android:networkSecurityConfig"] =
      "@xml/network_security_config";

    return config;
  });

  // Copy the network security configuration file to the android/app/src/main/res/xml folder
  config = withDangerousMod(config, [
    "android",
    async (config) => {
      const srcNetworkConfigPath = resolve(
        __dirname,
        "../src/xml/network_security_config.xml"
      );
      const dstNetworkConfigPath = resolve(
        config.modRequest.projectRoot,
        "android/app/src/main/res/xml/network_security_config.xml"
      );

      mkdirSync(dirname(dstNetworkConfigPath), { recursive: true });
      copyFileSync(srcNetworkConfigPath, dstNetworkConfigPath);

      return config;
    },
  ]);

  //Copy the /libs flder to the android/app/libs folder
  config = withDangerousMod(config, [
    "android",
    async (config) => {
      const srcNetworkConfigPath = resolve(__dirname, "../../android/libs");
      const dstNetworkConfigPath = resolve(
        config.modRequest.projectRoot,
        "android/app/libs"
      );

      mkdirSync(dirname(dstNetworkConfigPath), { recursive: true });
      copy(srcNetworkConfigPath, dstNetworkConfigPath);

      return config;
    },
  ]);
  //return config;
  return withAndroidZoomGradle(config);
};

export default createRunOncePlugin(withZoom, pkg.name, pkg.version);
