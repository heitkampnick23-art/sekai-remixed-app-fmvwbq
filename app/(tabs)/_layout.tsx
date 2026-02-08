
import React from 'react';
import FloatingTabBar from '@/components/FloatingTabBar';

export default function TabLayout() {
  const tabs = [
    {
      route: '/(tabs)/(home)',
      label: 'Home',
      ios_icon_name: 'house.fill',
      android_material_icon_name: 'home' as const,
    },
    {
      route: '/(tabs)/discover',
      label: 'Discover',
      ios_icon_name: 'sparkles',
      android_material_icon_name: 'explore' as const,
    },
    {
      route: '/(tabs)/community',
      label: 'Community',
      ios_icon_name: 'person.3.fill',
      android_material_icon_name: 'group' as const,
    },
    {
      route: '/(tabs)/profile',
      label: 'Profile',
      ios_icon_name: 'person.fill',
      android_material_icon_name: 'person' as const,
    },
  ];

  return <FloatingTabBar tabs={tabs} />;
}
