import { Column, Row, Text } from '@expo/ui/jetpack-compose';
import { background, fillMaxSize, fillMaxWidth, paddingAll } from '@expo/ui/jetpack-compose/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import type { LatestNewsProps } from './types';

// Kod z dyrektywą 'widget' działa w osobnym środowisku widżetu: bez hooków, importów i stałych spoza funkcji.
const LatestNewsWidget = (props: LatestNewsProps, environment: WidgetEnvironment) => {
  'widget';
  const dark = environment.colorScheme === 'dark';
  const green = dark ? '#3fb36b' : '#007434';
  const muted = dark ? '#9aa6a0' : '#5f6b63';
  const text = dark ? '#e7eee9' : '#16201a';

  return (
    <Column
      verticalArrangement={{ spacedBy: 8 }}
      modifiers={[fillMaxSize(), background(dark ? '#171e1a' : '#ffffff'), paddingAll(12)]}>
      <Row modifiers={[fillMaxWidth()]}>
        <Text color={green} style={{ fontSize: 13, fontWeight: 'bold' }}>
          Telewizja Sudecka
        </Text>
        <Text color={muted} style={{ fontSize: 11 }}>
          {'  · ' + props.updated}
        </Text>
      </Row>
      {props.items.length === 0 ? (
        <Text color={muted} style={{ fontSize: 13 }}>
          Otwórz aplikację, aby pobrać wiadomości.
        </Text>
      ) : (
        props.items.slice(0, 3).map((item, i) => (
          <Column key={i}>
            <Text color={text} maxLines={2} overflow="ellipsis" style={{ fontSize: 14, fontWeight: 'bold' }}>
              {item.title}
            </Text>
            <Text color={muted} style={{ fontSize: 11 }}>
              {item.time}
            </Text>
          </Column>
        ))
      )}
    </Column>
  );
};

export default createWidget('LatestNewsWidget', LatestNewsWidget, { items: [], updated: '' });
