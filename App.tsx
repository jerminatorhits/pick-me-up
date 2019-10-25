import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import HomeScreen from './src/HomeScreen';
import ProfileScreen from './src/ProfileScreen';
import MapScreen from './src/MapScreen';

const AppNavigator = createStackNavigator({
  Home: { screen: HomeScreen },
  Profile: { screen: ProfileScreen },
  Map: { screen: MapScreen },
});

const App = createAppContainer(AppNavigator);

export default App;
