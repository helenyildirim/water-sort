import React from 'react';
import { Pressable, Text, View } from 'react-native';

type Props = { children: React.ReactNode };

/** Shows a way back instead of a blank screen if something fails while rendering. */
export class ErrorBoundary extends React.Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#0b2250' }}>
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: '900', textAlign: 'center' }}>Something went wrong</Text>
        <Text style={{ color: '#9fb0d0', fontSize: 15, textAlign: 'center', marginTop: 8 }}>Your progress is safe.</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Try again"
          onPress={() => this.setState({ failed: false })}
          style={{ marginTop: 20, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 24, backgroundColor: '#2a8cff' }}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Try Again</Text>
        </Pressable>
      </View>
    );
  }
}
