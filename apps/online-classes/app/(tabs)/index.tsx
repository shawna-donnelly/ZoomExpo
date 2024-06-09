import {
  useColorScheme,
  Button,
  SafeAreaView,
  Platform,
  StatusBar,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { Colors } from "react-native/Libraries/NewAppScreen";
import { config } from "../../config/config";
import axios from "axios";
import reactotron from "reactotron-react-native";
import camelize from "camelize";
import * as ZoomSDK from "zoom-module";

interface ZoomMeeting {
  uuid: string;
  id: number;
  hostId: string;
  topic: string;
  type: number;
  startTime: Date;
  duration: number;
  timezone: string;
  createdAt: Date;
  joinUrl: string;
}

export default function HomeScreen() {
  const isDarkMode = useColorScheme() === "dark";
  const [meetings, setMeetings] = useState<ZoomMeeting[]>([]);
  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    marginTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  };

  useEffect(() => {
    getUserMeetings();
  }, []);

  const initializeZoom = useCallback(async () => {
    const { data } = await axios.post(`${config.serverURL}/jwt`);
    const { jwt } = data;
    reactotron.log!({ jwt });
    try {
      // reactotron.log!("PI", ZoomSDK.PI);
      ZoomSDK.initialize(jwt);
    } catch (e) {
      reactotron.log!("ERror in sdk", e.message);
    }
    //await authorize();
  }, []);

  const sayHello = useCallback(async () => {
    //console.log(ZoomSDK.hello());
  }, []);

  const getAccessToken = async () => {
    const { data: token } = await axios.post(`${config.serverURL}/authorize`);
    reactotron.log!({ token });
    return token;
  };

  const getUserMeetings = async () => {
    const token = await getAccessToken();
    reactotron.log!({ token });
    const { data } = await axios.get(`${config.serverURL}/meetings`, {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    reactotron.log!({ meetings: data });
    const meetingData: ZoomMeeting[] = camelize(data.meetings);
    reactotron.log!({ meetingData });
    setMeetings(meetingData);
  };

  const joinMeeting = async ({ meeting }: { meeting: ZoomMeeting }) => {
    reactotron.log!("Inside joinMeeting", meeting);
    const token = await getAccessToken();

    const { data } = await axios.get(`${config.serverURL}/zak`, {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    const zak = data.token;
    reactotron.log!({ zak, meetingId: meeting.id.toString() });
    ZoomSDK.joinMeeting(zak, "Shawna Test", meeting.id.toString());
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <Button title="Initialize Zoom" onPress={initializeZoom} />
      {meetings.map((meeting: ZoomMeeting) => {
        return (
          <Button
            key={meeting.id}
            title={meeting.topic}
            onPress={() => joinMeeting({ meeting })}
          />
        );
      })}
      <Button title="Say hi" onPress={sayHello} />
    </SafeAreaView>
  );
}
