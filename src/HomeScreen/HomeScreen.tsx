import React, { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';
import { getRandomJoke } from '../utils/JokesClient';

import { style } from './HomeScreenStyle';

function HomeScreenContent() {
  const [data, setJoke] = useState({ joke: '', isFetching: false });

  useEffect(() => {
    setJoke({...this.state, isFetching: true});
    getRandomJoke()
      .then(response => {
        setJoke({joke: response.data.value.joke, isFetching: false})
      })
      .catch(e => {
        console.log(e);
        setJoke({...data, isFetching: false});
      });
  }, []);

  return (
    <View style={style.container}>
      <Text>Open up App.tsx to start working on your app!</Text>
      <Text>{data.joke}</Text>
    </View>
  );
}

type Props = {
  navigation: any;
}

export default class HomeScreen extends React.Component<Props> {
  static navigationOptions = {
    title: 'Welcome',
  };
  render() {
    const { navigate } = this.props.navigation;
    return (
      <View>
        <HomeScreenContent />
        <Button
          title="Go to Jane's profile"
          onPress={() => navigate('Profile', {name: 'Jane'})}
        />
      </View>
    );
  }
}