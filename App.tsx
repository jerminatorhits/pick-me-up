import { GOOGLE_PLACES_API_KEY } from 'react-native-dotenv';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import axios from 'axios';

const JOKE_URL = 'http://api.icndb.com/jokes/random?firstName=John&amp;lastName=Doe';

export default function App() {
  const [data, setJoke] = useState({ joke: '', isFetching: false });

  useEffect(() => {
    setJoke({...this.state, isFetching: true});
    axios.get(JOKE_URL)
      .then(response => {
        setJoke({joke: response.data.value.joke, isFetching: false})
      })
      .catch(e => {
        console.log(e);
        setJoke({...data, isFetching: false});
      });
  }, []);

  return (
    <View style={styles.container}>
      <Text>Open up App.tsx to start working on your app!</Text>
      <Text>{data.joke}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
