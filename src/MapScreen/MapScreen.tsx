import React from 'react';
import { Button } from 'react-native';
import MapView from 'react-native-maps';

type Props = {
  navigation: any;
}

export default class Map extends React.Component<Props> {  
  render() {    
    return (      
      <MapView        
        style={{flex: 1}}        
        region={{latitude: 42.882004, longitude: 74.582748, latitudeDelta: 0.0922, longitudeDelta: 0.0421}}        
        showsUserLocation={true}      
      />    
    );  
  }}
