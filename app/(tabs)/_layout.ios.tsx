
import React from 'react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="(home)">
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      
      <NativeTabs.Trigger name="discover">
        <Icon sf={{ default: 'sparkles', selected: 'sparkles' }} />
        <Label>Discover</Label>
      </NativeTabs.Trigger>
      
      <NativeTabs.Trigger name="community">
        <Icon sf={{ default: 'person.3', selected: 'person.3.fill' }} />
        <Label>Community</Label>
      </NativeTabs.Trigger>
      
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: 'person', selected: 'person.fill' }} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
