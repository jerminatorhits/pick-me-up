// import React, { useEffect, useState } from 'react';
// import { View, Text, Button } from 'react-native';
// import { getRandomJoke } from '../utils/JokesClient';

// import { styles } from './HomeScreen';

// // export default function HomeScreen() {
// //   const [data, setJoke] = useState({ joke: '', isFetching: false });

// //   useEffect(() => {
// //     setJoke({...this.state, isFetching: true});
// //     getRandomJoke()
// //       .then(response => {
// //         setJoke({joke: response.data.value.joke, isFetching: false})
// //       })
// //       .catch(e => {
// //         console.log(e);
// //         setJoke({...data, isFetching: false});
// //       });
// //   }, []);

// //   return (
// //     <View style={styles.container}>
// //       <Text>Open up App.tsx to start working on your app!</Text>
// //       <Text>{data.joke}</Text>
// //     </View>
// //   );
// // }

// type Props = {
//   navigation: (string, object) => void;
// }

// export default class HomeScreen extends React.Component<Props> {
//   static navigationOptions = {
//     title: 'Welcome',
//   };
//   render() {
//     const { navigate } = this.props.navigation;
//     return (
//       <Button
//         title="Go to Jane's profile"
//         onPress={() => navigate('Profile', {name: 'Jane'})}
//       />
//     );
//   }
// }