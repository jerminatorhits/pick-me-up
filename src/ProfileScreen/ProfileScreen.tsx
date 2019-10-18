import React from 'react';
import { Button } from 'react-native';

type Props = {
  navigation: any;
}

export default class Profile extends React.Component<Props> {
  static navigationOptions = {
    title: 'Profile',
  };
  render() {
    const { navigate } = this.props.navigation;
    return (
      <Button
        title="Go Back to Home"
        onPress={() => navigate('Home', { name: "name_payload" })}
      />
    );
  }
}