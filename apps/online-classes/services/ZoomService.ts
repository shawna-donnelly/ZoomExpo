import axios from 'axios';
import {config} from '../config/config';
import reactotron from 'reactotron-react-native';

export const authorize = async () => {
  const {zoomAuthURL} = config;

  let token = await axios.post(zoomAuthURL);
  reactotron.log({token: token.data});
};
