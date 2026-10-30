import { HStack, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { containerBackground, font, foregroundStyle, lineLimit, padding, widgetURL } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import type { LatestNewsProps } from './types';

// Kod z dyrektywą 'widget' działa w osobnym środowisku widżetu: bez hooków, importów i stałych spoza funkcji.
const LatestNewsWidget = (props: LatestNewsProps, environment: WidgetEnvironment) => {
  'widget';
  const dark = environment.colorScheme === 'dark';
  const green = dark ? '#3fb36b' : '#007434';
  const muted = dark ? '#9aa6a0' : '#5f6b63';
  const text = dark ? '#e7eee9' : '#16201a';
  const count = environment.widgetFamily === 'systemLarge' ? 5 : 2;

  return (
    <VStack
      alignment="leading"
      spacing={8}
      modifiers={[
        padding({ all: 2 }),
        widgetURL('tvsudecka://'),
        containerBackground(dark ? '#171e1a' : '#ffffff', 'widget'),
      ]}>
      <HStack>
        <Text modifiers={[font({ weight: 'bold', size: 13 }), foregroundStyle(green)]}>Telewizja Sudecka</Text>
        <Spacer />
        <Text modifiers={[font({ size: 11 }), foregroundStyle(muted)]}>{props.updated}</Text>
      </HStack>
      {props.items.length === 0 ? (
        <Text modifiers={[font({ size: 13 }), foregroundStyle(muted)]}>Otwórz aplikację, aby pobrać wiadomości.</Text>
      ) : (
        props.items.slice(0, count).map((item, i) => (
          <VStack key={i} alignment="leading" spacing={2}>
            <Text modifiers={[font({ weight: 'semibold', size: 14 }), foregroundStyle(text), lineLimit(2)]}>
              {item.title}
            </Text>
            <Text modifiers={[font({ size: 11 }), foregroundStyle(muted)]}>{item.time}</Text>
          </VStack>
        ))
      )}
      <Spacer />
    </VStack>
  );
};

export default createWidget('LatestNewsWidget', LatestNewsWidget, { items: [], updated: '' });
